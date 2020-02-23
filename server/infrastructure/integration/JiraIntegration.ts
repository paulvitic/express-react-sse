import TicketBoardIntegration, {
    TicketBoardInfo,
    TicketBoardIntegrationFailure, TicketChangeLog, UpdatedTicket
} from "../../domain/product/service/TicketBoardIntegration";
import axios, {AxiosResponse, AxiosError} from "axios";
import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import * as O from 'fp-ts/lib/Option';
import {
    toTicketInfoAssertionFailure,
    toProjectInfo,
    toUpdatedTickets,
    toQueryDateFormat, toChangeLog
} from "./JiraIntegrationTranslator";
import LogFactory from "../../domain/LogFactory";
import {TicketUpdateCollectionPeriod} from "../../domain/product/TicketUpdateCollection";

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

    private readonly basicAuthorization: string;

    constructor(private readonly jiraUrl: string,
                jiraUser: string,
                jiraApiToken: string) {
        this.basicAuthorization = `Basic ${Buffer.from(jiraUser + ":" + jiraApiToken).toString("base64")}`
    }

    assertProject(key: string): TE.TaskEither<TicketBoardIntegrationFailure, TicketBoardInfo> {
        const url = `${this.jiraUrl}/rest/api/3/search?jql=project%3D${key}+ORDER+BY+created+asc&fields=project%2Ccreated&maxResults=1`;
        return pipe(
                this.executeGetRequest(url),
                TE.map(toProjectInfo),
                TE.chain(TE.fromEither)
        )
    }

    getUpdatedTickets(key: string, period: TicketUpdateCollectionPeriod): TE.TaskEither<TicketBoardIntegrationFailure, UpdatedTicket[]> {
        const url =  `${this.jiraUrl}/rest/api/3/search?jql=project%3D${key}+and+updated%3E%3D%22${toQueryDateFormat(period.from)}%22+and+updated%3C%22${toQueryDateFormat(period.to)}%22&fields=created%2Cupdated`;
        return pipe(
            this.executeGetRequest(url),
            TE.map(toUpdatedTickets),
            TE.chain(TE.fromEither)
        )
    }

    readTicketChangeLog(key: string, period: TicketUpdateCollectionPeriod):
        TE.TaskEither<TicketBoardIntegrationFailure, O.Option<TicketChangeLog>> {
        const url =  `${this.jiraUrl}/rest/api/3/issue/${key}?expand=changelog&fields=${this.ticketFields}`;
        return pipe(
            this.executeGetRequest(url),
            TE.chain(response => TE.right(T.task.of(toChangeLog(response, period))))
        )
    }

    private executeGetRequest(url: string): TE.TaskEither<TicketBoardIntegrationFailure, AxiosResponse<any>> {
        return TE.tryCatch(() => axios(url, {
            method: 'GET',
            headers: {
                Authorization: this.basicAuthorization,
                Accept: 'application/json'
            }}), error => toTicketInfoAssertionFailure(error as AxiosError))
    }
}
