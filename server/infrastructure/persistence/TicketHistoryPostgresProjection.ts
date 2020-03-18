import EventListener from "../../domain/EventListener";
import {TicketChanged} from "../../domain/product/event";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import {pipe} from "fp-ts/lib/pipeable";
import PostgresClient from "../clients/PostgresClient";
import {ChangeLog, ChangeFilter, Change} from "../../domain/product/service/TicketBoardIntegration";
import LogFactory from "../../domain/LogFactory";
import {array} from "fp-ts/lib/Array";
import {TicketHistory} from "../../domain/product/TicketHistory";
import * as translate from "./TicketHistoryPostgresTranslator";
import {TicketHistoryQueryService} from "../../domain/product/service/TicketHistoryQueryService";

function isForChapterFromArray(labels: string[]): boolean {
    let chapterLabel = "chapter-ticket";
    if (labels === undefined || labels === null || labels.length===0) return false;
    return labels.includes(chapterLabel);
}

function isForChapterFromString(labels: string): boolean {
    if (labels === undefined || labels === null) return false;
    return(isForChapterFromArray(labels.split(" ")))
}

function getChapterFromArray(labels: string[]): string {
    if (labels === undefined || labels === null || labels.length===0) return "Unknown";
    if (labels.includes("software-dev-qa-chapter")) return "Software development & QA";
    if (labels.includes("product-design-chapter")) return "Product development & Design";
    if (labels.includes("data-science-chapter")) return "Data Science";
    return "Unknown";
}

function getChapterFromString(labels: string): string {
    if (labels === undefined || labels === null) return "Unknown";
    return(getChapterFromArray(labels.split(" ")))
}

export class TicketHistoryPostgresProjection implements EventListener<TicketChanged> {
    private readonly log = LogFactory.get(TicketHistoryPostgresProjection.name);
    constructor(private readonly client: PostgresClient,
                private readonly ticketHistory: TicketHistoryQueryService) {}

    onEvent(event: TicketChanged): Promise<E.Either<Error, boolean>> {
        return pipe(
            this.ticketHistory.findLatestByTicketRef(event.ticketRef),
            TE.chain(optionalLatestHistory => optionalLatestHistory.foldL(
                () => this.insertFirstEntry(event),
                latestHistory => TE.right2v(latestHistory))),
            TE.chain(latestHistory => array.reduce(event.ticketChangeLog.changeLog, TE.taskEither.of(latestHistory), // FIXME: need to sort
                (previousHistory, changeLog) => previousHistory.chain(history =>
                    this.handleChangeLog(history, changeLog, history.storyPoints, history.sprintCount))
            )),
            TE.chain(() => TE.right2v(true))
        ).run();
    }

    private insertFirstEntry(event: TicketChanged):
        TE.TaskEither<Error, TicketHistory> {
        let {prodDevId, ticketRef, ticketKey, prodDevStartedOn, ticketChangeLog} = event;
        return this.executeInsert({
            latest: true,
            prodDevId,
            ticketRef,
            ticketKey,
            issueType: ticketChangeLog.issueType,
            storyPoints: ticketChangeLog.storyPoints,
            startedAt: new Date(prodDevStartedOn),
            endedAt: null,
            assignee: null,
            status: null,
            duration: null,
            forProductDev: ticketChangeLog.parentKey!==null,
            forChapter: isForChapterFromArray(ticketChangeLog.labels),
            chapter: getChapterFromArray(ticketChangeLog.labels),
            sprintCount: ticketChangeLog.sprintCount
        });
    }

    private handleChangeLog(previousHistory: TicketHistory, changeLog: ChangeLog, storyPoints: number, sprintCount:number):
    TE.TaskEither<Error, TicketHistory> {
        return pipe(
            TE.fromEither(this.updatePreviousHistory(previousHistory, changeLog)),
            TE.chain(previousHistory => this.executeUpdate(previousHistory)),
            TE.chain( previousHistory => TE.fromEither(this.createNewHistory(previousHistory, changeLog, storyPoints, sprintCount))),
            TE.chain( newHistory => this.executeInsert(newHistory))
        )
    }

    private updatePreviousHistory(previousHistory: TicketHistory, changeLog: ChangeLog):
        E.Either<Error, TicketHistory> {
        return pipe(
            E.tryCatch2v(() => {
                return {...previousHistory,
                    latest: false,
                    storyPoints: null,
                    sprintCount: null,
                    endedAt: new Date(changeLog.created),
                    duration: new Date(changeLog.created).getTime() - previousHistory.startedAt.getTime()
                }
            }, err => err as Error),
            E.chain(previousHistory => array.reduce(changeLog.changes, E.right(previousHistory),
                    (previous, change) => previous.chain( history => this.applyChangeOnUpdate(history, change)))
            )
        )
    }

    private createNewHistory(previousHistory: TicketHistory, changeLog: ChangeLog, storyPoints: number, sprintCount: number):
        E.Either<Error, TicketHistory> {
        return pipe(
            E.tryCatch2v(() => {
                return {
                    ...previousHistory,
                    latest: true,
                    startedAt: new Date(changeLog.created),
                    storyPoints,
                    sprintCount,
                    endedAt: null,
                    duration: null
                }
            }, err => err as Error),
            E.chain(previousHistory => array.reduce(changeLog.changes, E.right(previousHistory),
                (previous, change) => previous.chain( history => this.applyChangeToNew(history, change)))
            )
        )
    }

    private applyChangeOnUpdate(previousHistory: TicketHistory, change: Change): E.Either<Error, TicketHistory> {
        return E.tryCatch2v(() => {
            switch (change.type) {
                case ChangeFilter.status.type:
                    return {
                        ...previousHistory,
                        status: previousHistory.status === null ? change.fromString : previousHistory.status
                    };
                case ChangeFilter.assignee.type:
                    return {
                        ...previousHistory,
                        assignee: previousHistory.assignee === null ? change.fromString : previousHistory.assignee
                    };
                case ChangeFilter.issuetype.type:
                    return {
                        ...previousHistory,
                        issueType: previousHistory.issueType === null ? change.fromString : previousHistory.issueType
                    };
                case ChangeFilter.IssueParentAssociation.type:
                    return {
                        ...previousHistory,
                        forProductDev: previousHistory.forProductDev === null ? change.fromString!==null : previousHistory.forProductDev
                    };
                case ChangeFilter.labels.type:
                    return {
                        ...previousHistory,
                        forChapter: previousHistory.forChapter === null ? isForChapterFromString(change.fromString) : previousHistory.forChapter,
                        chapter: previousHistory.chapter === null ? getChapterFromString(change.fromString) : previousHistory.chapter
                    };
                default:
                    return previousHistory
            }
        }, err => err as Error)
    }

    private applyChangeToNew(newHistory: TicketHistory, change: Change): E.Either<Error, TicketHistory> {
        return E.tryCatch2v(() => {
            switch (change.type) {
                case ChangeFilter.status.type:
                    return {
                        ...newHistory,
                        status: change.toString
                    };
                case ChangeFilter.assignee.type:
                    return {
                        ...newHistory,
                        assignee: change.toString
                    };
                case ChangeFilter.issuetype.type:
                    return {
                        ...newHistory,
                        issueType: change.toString
                    };
                case ChangeFilter.IssueParentAssociation.type:
                    return {
                        ...newHistory,
                        forProductDev: change.toString!==null
                    };
                case ChangeFilter.labels.type:
                    return {
                        ...newHistory,
                        forChapter: isForChapterFromString(change.toString),
                        chapter: getChapterFromString(change.toString)
                    };
                default:
                    this.log.warn(`${newHistory.ticketKey} ${change.type} update from: ${change.from}:${change.fromString}, to ${change.to}:${change.toString}`);
                    return newHistory
            }
        }, err => err as Error)
    }

    private executeUpdate(previousHistory: TicketHistory): TE.TaskEither<Error, TicketHistory> {
        return pipe(
            TE.fromEither(translate.toUpdateQuery(previousHistory)),
            TE.chain(query => this.client.query(query)),
            TE.chain(() => TE.right2v(previousHistory))
        )
    }

    private executeInsert(history: TicketHistory): TE.TaskEither<Error, TicketHistory> {
        return pipe(
            TE.fromEither(translate.toInsertQuery(history)),
            TE.chain(query => this.client.query(query)),
            TE.chain(() => TE.right2v(history))
        )
    }
}
