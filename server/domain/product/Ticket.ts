import AggregateRoot from "../AggregateRoot";
import LogFactory from "../LogFactory";
import TicketHistory from "./TicketHistory";
import {ChangeLog} from "./service/TicketBoardIntegration";
import * as E from "fp-ts/lib/Either";

export default class Ticket extends AggregateRoot {
    private readonly log = LogFactory.get(Ticket.name);
    constructor(id: string,
                private _key: string,
                private _ref: number,
                private _prodDevId: string,
                private _ticketHistory?: TicketHistory[]) {
        super(id);
        if (!_key || !_ref) throw new Error("external id or key can not be undefined.");
    }

    static create(ticketKey: string, ticketRef: number, prodDevId: string) {
        return undefined;
    }

    recordHistory(changeLog: ChangeLog[]): E.Either<Error, void> {
        throw new Error("Method not implemented.");
    }
}

