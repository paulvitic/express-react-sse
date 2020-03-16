import EventListener from "../../domain/EventListener";
import {TicketChanged} from "../../domain/product/event";
import * as E  from "fp-ts/lib/Either";
import * as TE  from "fp-ts/lib/TaskEither";
import * as O  from "fp-ts/lib/Option";

import {pipe} from "fp-ts/lib/pipeable";
import PostgresClient from "../clients/PostgresClient";
import {ChangeLog, ChangelogFilter} from "../../domain/product/service/TicketBoardIntegration";
import PostgresRepository from "./PostgresRepository";
import LogFactory from "../../domain/LogFactory";

export class TicketHistoryPostgresProjection implements EventListener<TicketChanged> {
    private readonly log = LogFactory.get(TicketHistoryPostgresProjection.name);

    constructor(private readonly client: PostgresClient) {}

    onEvent(event: TicketChanged): Promise<E.Either<Error, boolean>> {
        return pipe(
            this.current(event.ticketRef),
            TE.chain(optionalCurrentHistory => optionalCurrentHistory.foldL(
                () => this.insert(event.prodDevId, event.ticketRef, event.ticketKey),
                history => TE.right2v(history))),
            TE.chain(history =>
                this.handleChange(history, event.changeLog[0]))
        ).run();
    }

    private current(ticketRef: number): TE.TaskEither<Error, O.Option<any[]>>{
        let query = `
        SELECT * FROM ticket_history WHERE ticket_ref=${ticketRef} AND current=true;
        `;
        return pipe(
            this.client.query(query),
            TE.map(queryResult =>
                O.fromNullable(queryResult.rows[0]))
        );
    }

    private insert(prodDevId: string, ticketRef: number, ticketKey:string): TE.TaskEither<Error, any[]>{
        let query = `
        INSERT INTO ticket_history(current, product_dev_fk, ticket_ref, ticket_key, started_at) 
            VALUES (true, '${prodDevId}', ${ticketRef}, '${ticketKey}', '${PostgresRepository.toSqlDate(new Date())}')
            RETURNING *;
        `;
        return pipe(
            this.client.query(query),
            TE.map(queryResult =>
                queryResult.rows[0])
        );
    }

    private handleChange(current: any[], changeLog: ChangeLog):
        TE.TaskEither<Error, boolean> {
        switch (changeLog.type) {
            case ChangelogFilter.customfield_10010.type:
                this.log.info(`sprint/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.assignee.type:
                this.log.info(`assignee/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.issuetype.type:
                this.log.info(`issueType/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.status.type:
                this.log.info(`status/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.labels.type:
                this.log.info(`labels/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.project.type:
                this.log.info(`project/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.Key.type:
                this.log.info(`key/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.customfield_10008.type:
                this.log.info(`epicLink/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            default:
                this.log.info(`default/${changeLog.type}, from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true)
        }
    }
}
