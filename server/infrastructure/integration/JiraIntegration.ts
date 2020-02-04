import TicketBoardIntegration, {
    TicketBoardInfo,
    TicketBoardIntegrationFailure
} from "../../domain/product/TicketBoardIntegration";
import axios, {AxiosResponse, AxiosError} from "axios";
import WinstonLogFactory from "../context/WinstonLogFactory";
import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import {toTicketInfoAssertionFailure, toProjectInfo} from "./JiraIntegrationTranslator";

export default class JiraIntegration implements TicketBoardIntegration {
    private readonly log = WinstonLogFactory.get(JiraIntegration.name);
    private readonly and ="AND ";
    private readonly openTickets = "status not in (Closed, Done) ";
    private readonly projects = "project in (Contact) ";
    private readonly createdAfter = "createdDate >= ";

    private readonly basicAuthorization: string;

    constructor(private readonly jiraUrl: string,
                jiraUser: string,
                jiraApiToken: string) {
        this.basicAuthorization = `Basic ${Buffer.from(jiraUser + ":" + jiraApiToken).toString("base64")}`
    }

    assertProject(key: string): TE.TaskEither<TicketBoardIntegrationFailure, TicketBoardInfo> {
        const url = `${this.jiraUrl}/rest/api/2/project/${key}`;
        return pipe(
                this.requestProjectInfo(url),
                TE.map(toProjectInfo),
                TE.chain(TE.fromEither)
        )
    }

    private requestProjectInfo(url: string): TE.TaskEither<TicketBoardIntegrationFailure, AxiosResponse<any>> {
        return TE.tryCatch(() => axios(url, {
            method: 'GET',
            headers: {
                Authorization: this.basicAuthorization,
                Accept: 'application/json'
            }}), error => toTicketInfoAssertionFailure(error as AxiosError))
    }

    private toDateString = (date: Date): string => {
        const d = date.getDate();
        const m = date.getMonth() + 1; //Month from 0 to 11
        const y = date.getFullYear();
        return `"${y}/${ m<=9 ? '0'+m : m }/${ d <= 9 ? '0'+d : d}"`;
    };
}
