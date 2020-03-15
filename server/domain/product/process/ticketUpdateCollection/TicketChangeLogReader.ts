import LogFactory from "../../../LogFactory";
import EventBus from "../../../EventBus";
import TicketBoardIntegration, {TicketChangeLog, UpdatedTicket} from "../../service/TicketBoardIntegration";
import {
    UpdatedTicketsListFetched
} from "../../event";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import {array} from "fp-ts/lib/Array";
import {TicketUpdateCollectionProcess} from "./TicketUpdateCollectionProcess";
import TicketUpdateCollectionRepository from "../../repository/TicketUpdateCollectionRepository";
import TicketUpdateCollection from "../../TicketUpdateCollection";

export default class TicketChangeLogReader extends TicketUpdateCollectionProcess {
    private readonly log = LogFactory.get(TicketChangeLogReader.name);
    constructor(repo: TicketUpdateCollectionRepository,
                eventBus: EventBus,
                private readonly integration: TicketBoardIntegration) {
        super(repo, eventBus)
    }

    onEvent(sourceEvent: UpdatedTicketsListFetched): Promise<E.Either<Error, boolean>> {
        this.log.info(`Processing ${UpdatedTicketsListFetched.name} event`);
        return pipe(
            this.repo.findLatestByProject(sourceEvent.prodDevId),
            TE.chain(collection => collection.isNone() ?
                TE.left2v(new Error('collection does not exists')) :
                TE.right2v(collection.value)),
            TE.chainFirst(collection => this.readUpdatedTicketsChangeLogs(sourceEvent, collection)),
            TE.chain(collection =>
                this.repo.update(collection.id, collection)),
            TE.chain(collection => this.eventBus.publishEventsOf(collection)),
        ).run();
/*
        let allPublished = array.map(events,async (event) => {
            let published =  await this.eventBus.publishEvent(event).run();
            return published.isRight() && published.value ? E.right(null) : E.left(new Error("event not published"));
        });
        return array.reduce(await Promise.all(allPublished) as E.Either<Error, void>[],
            E.right<Error, void>(null),
            (previous, current) => {return previous.chain(() => current)});*/
    }

    readUpdatedTicketsChangeLogs(sourceEvent: UpdatedTicketsListFetched, collection: TicketUpdateCollection):
        TE.TaskEither<Error,void> {
        //array.sequence(E.either)(rows.map(row =>  toTicketUpdate(row))).fold(() => E.right(null), r => E.right(r))
        /*return array.sequence(
            sourceEvent.updatedTickets.map( updatedTicket => this.readTicketChangeLog(sourceEvent, collection, updatedTicket)));*/
        return array.reduce(sourceEvent.updatedTickets, TE.taskEither.of(null), (previous, current) => {
            return previous.foldTaskEither( err => TE.left2v(err), () => this.readTicketChangeLog(sourceEvent, collection, current))
        });
        /*return array.traverse(TE.taskEither)(
            sourceEvent.updatedTickets,updatedTicket => this.readTicketChangeLog(sourceEvent, collection, updatedTicket));*/
    }

    private readTicketChangeLog(sourceEvent: UpdatedTicketsListFetched, collection: TicketUpdateCollection, updatedTicket: UpdatedTicket):
        TE.TaskEither<Error,void>{
        return this.integration.readTicketChangeLog(updatedTicket.key, new Date(sourceEvent.fromDate), new Date(sourceEvent.toDate))
            .foldTaskEither(
                err => TE.fromEither(collection.failCollection(TicketChangeLogReader.name, err.message)),
                optionalResponse => TE.fromEither(optionalResponse.foldL(
                    () => collection.completedForTicket(updatedTicket.id, updatedTicket.key, []),
                    response => collection.completedForTicket(updatedTicket.id, updatedTicket.key, response.changeLog)
                ))
        )
    }
}
