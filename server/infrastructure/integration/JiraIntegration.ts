import TicketBoardIntegration, {
    TicketBoardInfo,
    TicketBoardIntegrationFailure, TicketChangeLog, UpdatedTicket
} from "../../domain/product/service/TicketBoardIntegration";
import axios, {AxiosResponse, AxiosError} from "axios";
import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import * as O from 'fp-ts/lib/Option';
import * as translate from "./JiraIntegrationTranslator";
import LogFactory from "../../domain/LogFactory";

export type JiraIntegrationParams = {
    url: string,
    user: string;
    apiToken: string
};

export default class JiraIntegration implements TicketBoardIntegration {
    private readonly log = LogFactory.get(JiraIntegration.name);
    private readonly ticketFields = [
        'created',
        'updated',
        'statuscategorychangedate',
        'project',
        'issuetype',
        'labels',
        'assignee',
        'status',
        'customfield_10010'
    ];
    private readonly url: string;
    private readonly basicAuthorization: string;

    constructor(params: JiraIntegrationParams) {
        this.url = params.url;
        this.basicAuthorization = `Basic ${Buffer.from(params.user + ":" + params.apiToken).toString("base64")}`
    }

    assertProject(key: string):
        TE.TaskEither<TicketBoardIntegrationFailure, TicketBoardInfo>{
        return pipe(
            TE.fromEither(translate.toAssertProjectUrl(this.url, key)),
            TE.chain(this.executeGetRequest),
            TE.chainFirst(response => TE.rightIO(this.log.io.debug(`Assert project response: ${JSON.stringify(response.data)}`))),
            TE.map(translate.toProjectInfo),
            TE.chain(TE.fromEither)
        )
    };

    getUpdatedTickets(key: string, from: Date, to: Date):
        TE.TaskEither<TicketBoardIntegrationFailure, UpdatedTicket[]> {
        return pipe(
            TE.fromEither(translate.toGetUpdatedTicketsUrl(this.url, key, from, to)),
            TE.chain(this.executeGetRequest),
            TE.chainFirst(response => TE.rightIO(this.log.io.debug(`get updated tickets response: ${JSON.stringify(response.data)}`))),
            TE.map(translate.toUpdatedTickets),
            TE.chain(TE.fromEither)
        )
    };

    readTicketChangeLog(key: string, from: Date, to: Date):
        TE.TaskEither<TicketBoardIntegrationFailure, O.Option<TicketChangeLog>> {
        return pipe(
            TE.fromEither(translate.toReadTicketChangeLogUrl(this.url, key, this.ticketFields)),
            TE.chain(this.executeGetRequest),
            TE.chainFirst(response => TE.rightIO(this.log.io.debug(`read ticket change log response  response: ${JSON.stringify(response.data)}`))),
            TE.chain(response => TE.right(T.task.of(translate.toChangeLog(response, from, to))))
        )
    };

    private executeGetRequest=(url: string): TE.TaskEither<TicketBoardIntegrationFailure, AxiosResponse<any>> => {
        return TE.tryCatch(() => axios(url, {
            method: 'GET',
            headers: {
                Authorization: this.basicAuthorization,
                Accept: 'application/json'
            }}), error => translate.toTicketInfoAssertionFailure(error as AxiosError))
    }
}
