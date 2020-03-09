import {
    ChangeLog,
    TicketBoardInfo,
    TicketBoardIntegrationFailure, TicketChangeLog,
    UpdatedTicket
} from "../../domain/product/service/TicketBoardIntegration";
import * as E from 'fp-ts/lib/Either'
import { AxiosResponse, AxiosError} from "axios";
import {TicketUpdateCollectionPeriod} from "../../domain/product/TicketUpdateCollection";
import {array} from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import {pipe} from "fp-ts/lib/pipeable";
import LogFactory from "../../domain/LogFactory";
import * as s from "connect-redis";


const changelogFilter = {
    customfield_10011: {
        field: "Rank",
        fieldId: "customfield_10011",
        use: false
    },
    customfield_10010: {
        field: "Sprint",
        fieldId: "customfield_10010",
        use: true
    },
    status : {
        field: "status",
        fieldId: "status",
        use: true
    },
    issuetype: {
        field: "issuetype",
        fieldId: "issuetype",
        use: true
    },
    Workflow: {
        field: "Workflow",
        fieldId: undefined,
        use: false
    },
    customfield_10031: {
        field: "Story point estimate",
        fieldId: "customfield_10031",
        use: false
    },
    labels: {
        field: "labels",
        fieldId: "labels",
        use: true
    },
    assignee: {
        field: "assignee",
        fieldId: "assignee",
        use: true
    },
    description: {
        field: "description",
        fieldId: "description",
        use: false
    },
    customfield_10017: {
        field: "Complexity Points",
        fieldId: "customfield_10017",
        use: false
    },
    project: {
        field: "project",
        fieldId: undefined,
        use: true
    },
    Key: {
        field: "Key",
        fieldId: undefined,
        use: true
    },
    customfield_10008: {
        field: "Epic Link",
        fieldId: "customfield_10008", // check if this can really be used as epic link and therefore product feature
        use: true
    }
};



export function toGetUpdatedTicketsUrl(baseUrl:string, key:string, period:TicketUpdateCollectionPeriod):
    E.Either<Error, string>{
    return E.tryCatch2v(() =>
        `${this.url}/rest/api/3/search?jql=project%3D${key}+and+updated%3E%3D%22${toQueryDateFormat(period.from)}%22+and+updated%3C%22${toQueryDateFormat(period.to)}%22&fields=created%2Cupdated`
    , err => new Error(`error while translating to get updated tickets url: ${(err as Error).message}`))
}


export function toProjectInfo({ data }: AxiosResponse<any>):
    E.Either<TicketBoardIntegrationFailure, TicketBoardInfo> {
    return E.tryCatch2v(
        () => {
            let {issues: [issue]} = data;
            let {fields: {project, created}} = issue;
            let { id, key, name, description, projectCategory } = project;
            return {id, key, name , description, projectCategory, created: toBeginningOfDay(created)}
        },
            reason => new TicketBoardIntegrationFailure(String(reason)))
}

export function toUpdatedTickets({ data }: AxiosResponse<any>):
    E.Either<TicketBoardIntegrationFailure, UpdatedTicket[]> {
    return E.tryCatch2v(
        () => {
            if (data.total === 0) return [];
            let updates = new Array<UpdatedTicket>();
            let {issues} = data;
            for (let issue of issues) {
                let {id, key} = issue;
                updates.push({id, key})
            }
            return updates;
        },
        reason => new TicketBoardIntegrationFailure(String(reason)))
}

export function toTicketInfoAssertionFailure({response}: AxiosError): TicketBoardIntegrationFailure {
    if (response){
        switch (response.status) {
            case 401:
                return new TicketBoardIntegrationFailure(
                    "Authentication credentials are incorrect or missing");
            case 404:
                return new TicketBoardIntegrationFailure(
                    "Project is not found or the user does not have permission to view it");
            default:
                return new TicketBoardIntegrationFailure(
                    `Project assert failed with unknown jira API error status code ${response.status}`);
        }
    } else {
        return new TicketBoardIntegrationFailure(
            `Project assert response is not available`);
    }
}

export function toChangeLog({ data }: AxiosResponse<any>, period: TicketUpdateCollectionPeriod):
    O.Option<TicketChangeLog>{
    let {id, key, changelog: { histories } } = data;
    return pipe(
        O.option.of(array
            .filterMap(histories, history => fromHistory(history, period)) // filters Option.none's
            .reduceRight((previous, current) => {return previous.concat(current)})), // flattens change log arrays from multiple history entries
        O.filter(logs => logs.length !== 0), // if there are any change logs, then passes Option.some of change logs array
        O.map(changeLog => {return {id, key, changeLog}})
    )
}

function fromHistory(history:any, period:TicketUpdateCollectionPeriod): O.Option<ChangeLog[]>  {
    return pipe(
        O.option.of(history),
        O.filter(history => period.isDuring(new Date(history.created))), // if history is not created during update collection period than passes Option.none
        O.map(history => fromHistoryEntries(history.items, history.created))
    )
}

function fromHistoryEntries(entries: any[], timeStamp: Date): ChangeLog[] {
    const log = LogFactory.get("JiraIntegrationTranslator");
    return array.filterMap(entries, entry => {
        let {field, fieldId, from, fromString, to, toString} = entry;
        return pipe(
            O.fromNullable(changelogFilter[field] || changelogFilter[fieldId]),
            O.fold(() => warnUnmappedField(field, fieldId),
                    filter => O.some(filter)),
            O.filter(filter => filter.use),
            O.map(() => {return {field, timeStamp, fieldId, from, fromString, to, toString}})
        )
    })
}

function toBeginningOfDay(dateString: string): Date {
    let date = new Date(dateString);
    date.setHours(0,0,0,0);
    return date;
}


function warnUnmappedField(field: string, fieldId:string): O.Option<void> {
    const log = LogFactory.get("JiraIntegrationTranslator");
    log.warn(`History item field ${field} or field id ${fieldId} can not be mapped to change log filter`);
    return O.none;
}

function toQueryDateFormat(date: Date): string {
    const d = date.getDate();
    const m = date.getMonth() + 1; //Month from 0 to 11
    const y = date.getFullYear();
    return `${y}%2F${ m<=9 ? '0'+m : m }%2F${ d <= 9 ? '0'+d : d}`;
}
