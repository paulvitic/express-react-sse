import TicketBoardIntegration, {TicketBoardInfo} from "../../domain/product/TicketBoardIntegration";
import axios from "axios";
import LogFactory from "../context/LogFactory";
import {withFailure, withSuccess} from "../../domain/Except";
import {translateProjectAssertResponse} from "./JiraIntegrationTranslator";

/**
 *
 */
export default class JiraIntegration implements TicketBoardIntegration {
    private readonly log = LogFactory.get(JiraIntegration.name);
    private readonly and ="AND ";
    private readonly openTickets = "status not in (Closed, Done) ";
    private readonly projects = "project in (Contact) ";
    private readonly createdAfter = "createdDate >= ";

    private basicAuthorization: string;

    constructor(private readonly jiraUrl: string,
                jiraUser: string,
                jiraApiToken: string) {
        this.basicAuthorization = `Basic ${Buffer.from(jiraUser + ":" + jiraApiToken).toString("base64")}`
    }

    assertProject(key: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const url = `${this.jiraUrl}/rest/api/2/project/${key}`;
            //const fields = "&fields=created,updated,statuscategorychangedate,project,issuetype,labels,assignee,status,customfield_10010"

            axios(url, {
                method: 'GET',
                headers: {
                    Authorization: this.basicAuthorization,
                    Accept: 'application/json'
                },
            }).then(resp => {
                resolve(translateProjectAssertResponse(resp.status, resp.data));
            }).catch(err => {
                this.log.error(`Error while asserting project key ${key}`, err);
                resolve(translateProjectAssertResponse(err.response.status));
            })
        })
    }

    private toDateString = (date: Date) => {
        const d = date.getDate();
        const m = date.getMonth() + 1; //Month from 0 to 11
        const y = date.getFullYear();
        return `"${y}/${ m<=9 ? '0'+m : m }/${ d <= 9 ? '0'+d : d}"`;
    };

}
