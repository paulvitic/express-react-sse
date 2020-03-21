import EventListener from "../../domain/EventListener";
import {TicketChanged} from "../../domain/product/event";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import {pipe} from "fp-ts/lib/pipeable";
import PostgresClient from "../clients/PostgresClient";
import {Change, ChangeFilter, ChangeLog} from "../../domain/product/service/TicketBoardIntegration";
import LogFactory from "../../domain/LogFactory";
import {array} from "fp-ts/lib/Array";
import {TicketHistory, TicketWorkType} from "../../domain/product/TicketHistory";
import * as translate from "./TicketHistoryPostgresTranslator";
import {TicketHistoryQueryService} from "../../domain/product/service/TicketHistoryQueryService";

const initialTicketStatus = "Backlog";

const getArrayFromString = (value: string, delimeter:string): string[] => {
    return value && value.trim() ? value.split(delimeter).map((item) => item.trim()) : [];
};

const getChapterWorkType = (labels: string[]): TicketWorkType => {
    if (labels === undefined || labels === null || labels.length===0) return null;
    else if (labels.includes("project-ticket")) return TicketWorkType.PROJECT;
    else if (labels.includes("software-dev-qa-chapter")) return TicketWorkType.SOFTWARE_QA_CHAPTER;
    else if (labels.includes("data-science-chapter")) return TicketWorkType.DATA_SCIENCE_CHAPTER;
    else if (labels.includes("product-design-chapter")) return TicketWorkType.PRODUCT_DESIGN_CHAPTER;
    else if (labels.includes("chapter-ticket")) return TicketWorkType.CHAPTER;
    else return null;
};

const determineWorkType = (parentKey:string, labels: string[]): TicketWorkType => {
    let chapterWork = getChapterWorkType(labels);
    if (parentKey===null && chapterWork!==null) return chapterWork;
    else if (parentKey!==null && chapterWork===null) return TicketWorkType.PRODUCT_DEVELOPMENT;
    else return TicketWorkType.UNKNOWN
};

const workTypeFromParentAssociationChange = (currentWorkType: TicketWorkType, parentKey:string)
    : TicketWorkType => {
    if (currentWorkType===TicketWorkType.PRODUCT_DEVELOPMENT || currentWorkType===TicketWorkType.UNKNOWN) {
        if (parentKey!== null) return TicketWorkType.PRODUCT_DEVELOPMENT;
        else return TicketWorkType.UNKNOWN
    } else {
        if (parentKey!== null) return TicketWorkType.UNKNOWN;
        else return currentWorkType
    }
};
const workTypeFromLabelsChange = (currentWorkType: TicketWorkType, labels:string)
    : TicketWorkType => {
    let chapterWorkType = getChapterWorkType(getArrayFromString(labels, " "));
    if (currentWorkType!==TicketWorkType.PRODUCT_DEVELOPMENT) {
        if (chapterWorkType!== null) return chapterWorkType;
        else return TicketWorkType.UNKNOWN
    } else {
        if (chapterWorkType!== null) return chapterWorkType;
        else return currentWorkType
    }
};

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
        let {ticketRef, ticketKey, prodDevStartedOn, ticketChangeLog, prodDevId, aggregateId} = event;
        let workType = determineWorkType(ticketChangeLog.parentKey, ticketChangeLog.labels);
        return this.executeInsert({
            latest: true,
            ticketRef,
            ticketKey,
            issueType: ticketChangeLog.issueType,
            workType,
            storyPoints: ticketChangeLog.storyPoints,
            startedAt: new Date(prodDevStartedOn),
            endedAt: null,
            assignee: null,
            status: initialTicketStatus,
            duration: null,
            sprintCount: ticketChangeLog.sprintCount,
            prodDevId,
            collectionId: aggregateId
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
                        status: change.fromString
                    };
                case ChangeFilter.assignee.type:
                    return {
                        ...previousHistory,
                        assignee: change.fromString
                    };
                case ChangeFilter.issuetype.type:
                    return {
                        ...previousHistory,
                        issueType: change.fromString
                    };
                case ChangeFilter.IssueParentAssociation.type:
                    return {
                        ...previousHistory,
                        //workType: workTypeFromParentAssociationChange(previousHistory.workType, change.fromString)
                    };
                case ChangeFilter.labels.type:
                    return {
                        ...previousHistory,
                        //workType: workTypeFromLabelsChange(previousHistory.workType, change.fromString)
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
                        workType: workTypeFromParentAssociationChange(newHistory.workType, change.toString)
                    };
                case ChangeFilter.labels.type:
                    return {
                        ...newHistory,
                        workType: workTypeFromLabelsChange(newHistory.workType, change.toString)
                    };
                default:
                    this.log.warn(`${newHistory.ticketKey} ${change.type} update from: ${change.from}:${change.fromString}, to ${change.to}:${change.toString}`);
                    return newHistory
            }
        }, err => err as Error)
    }

    private executeUpdate(history: TicketHistory): TE.TaskEither<Error, TicketHistory> {
        return pipe(
            TE.fromEither(translate.toUpdateQuery(history)),
            TE.chain(query => this.client.query(query)),
            TE.chain(() => TE.right2v(history))
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
