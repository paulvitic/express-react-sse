import {Request} from 'express';
import {
    CollectTicketUpdates
} from "../../../application/product/commands";
import * as E from "fp-ts/lib/Either";

export const searchParam = {
    productDevId: "productDevId"
};

export const searchMethod = {
    findLatestByProductId: "findLatestByProductId"
};

class TicketUpdateCollectionReqTranslatorError extends Error {
    constructor(message) {
        super(message);
        this.name = TicketUpdateCollectionReqTranslatorError.name;
    }
}

type TicketUpdateCollectionCommand = CollectTicketUpdates

export function toCommand(req: Request): E.Either<Error, TicketUpdateCollectionCommand> {
    return E.tryCatch2v(() => {
        switch (req.method) {
            case 'POST':
                return new CollectTicketUpdates(req.body.productDevId)
            default:
                throw new TicketUpdateCollectionReqTranslatorError(
                    `translation for request method ${req.method} is not implemented`)
        }
    }, err => err as Error)
}


export function toSearchMethod(req: Request): E.Either<Error, {name: string, params: Map<string, any>}> {
    return E.tryCatch2v(() => {
        let productDevId = req.query.productDevId;
        let latest = req.query.latest;
        let params = new Map<string, any>();
        params.set(searchParam.productDevId, productDevId);
        return {name : searchMethod.findLatestByProductId , params}
    }, err => err as Error)
}

