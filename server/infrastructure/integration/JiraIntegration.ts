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
import {TicketUpdateCollectionPeriod} from "../../domain/product/TicketUpdateCollection";

export type JiraIntegrationParams = {
    url: string,
    user: string;
    apiToken: string
};

export default class JiraIntegration implements TicketBoardIntegration {
    private readonly log = LogFactory.get(JiraIntegration.name);
    private readonly and ="AND ";
    private readonly openTickets = "status not in (Closed, Done) ";
    private readonly projects = "project in (Contact) ";
    private readonly createdAfter = "createdDate >= ";
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
        const url = `${this.url}/rest/api/3/search?jql=project%3D${key}+ORDER+BY+created+asc&fields=project%2Ccreated&maxResults=1`;
        return pipe(
            this.executeGetRequest(url),
            TE.chainFirst(response => TE.rightIO(this.log.io.info(`Assert project response: ${JSON.stringify(response.data)}`))),
            TE.map(translate.toProjectInfo),
            TE.chain(TE.fromEither)
        )
    };

    getUpdatedTickets(key: string, from: Date, to: Date):
        TE.TaskEither<TicketBoardIntegrationFailure, UpdatedTicket[]> {
        return pipe(
            TE.fromEither(translate.toGetUpdatedTicketsUrl(this.url, key, from, to)),
            TE.chain(this.executeGetRequest),
            TE.chainFirst(response => TE.rightIO(this.log.io.info(`get updated tickets response: ${JSON.stringify(response.data)}`))),
            TE.map(translate.toUpdatedTickets),
            TE.chain(TE.fromEither)
        )
    };

    readTicketChangeLog(key: string, from: Date, to: Date):
        TE.TaskEither<TicketBoardIntegrationFailure, O.Option<TicketChangeLog>> {
        const url =  `${this.url}/rest/api/3/issue/${key}?expand=changelog&fields=${this.ticketFields}`;
        return pipe(
            this.executeGetRequest(url),
            TE.chainFirst(response => TE.rightIO(this.log.io.info(`read ticket change log response  response: ${JSON.stringify(response.data)}`))),
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
