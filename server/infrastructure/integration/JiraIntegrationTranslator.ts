import {
    ChangeLog, ChangelogFilter,
    TicketBoardInfo,
    TicketBoardIntegrationFailure, TicketChangeLog,
    UpdatedTicket
} from "../../domain/product/service/TicketBoardIntegration";
import * as E from 'fp-ts/lib/Either'
import { AxiosResponse, AxiosError} from "axios";
import {array} from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import {pipe} from "fp-ts/lib/pipeable";
import LogFactory from "../../domain/LogFactory";

export function toGetUpdatedTicketsUrl(baseUrl:string, key:string, from, to):
    E.Either<Error, string>{
    return E.tryCatch2v(() =>
        `${baseUrl}/rest/api/3/search?jql=project%3D${key}+and+updated%3E%3D%22${toQueryDateFormat(from)}%22+and+updated%3C%22${toQueryDateFormat(to)}%22&fields=created%2Cupdated`
    , err => new Error(`error while translating to get updated tickets url: ${(err as Error).message}`))
}

export function toAssertProjectUrl(baseUrl:string, key:string):
    E.Either<Error, string>{
    return E.tryCatch2v(() =>
            `${baseUrl}/rest/api/3/search?jql=project%3D${key}+ORDER+BY+created+asc&fields=project%2Ccreated&maxResults=1`
        , err => new Error(`error while translating to get updated tickets url: ${(err as Error).message}`))
}

export function toReadTicketChangeLogUrl(baseUrl:string, key:string, ticketFields: string[]):
    E.Either<Error, string>{
    return E.tryCatch2v(() =>
            `${baseUrl}/rest/api/3/issue/${key}?expand=changelog&fields=${ticketFields}`
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

export function toChangeLog({ data }: AxiosResponse<any>, from: Date, to: Date):
    O.Option<TicketChangeLog>{
    let {id, key, changelog: { histories } } = data;
    return pipe(
        O.option.of(array
            .filterMap(histories, history => fromHistory(history, from, to)) // filters Option.none's
            .reduceRight((previous, current) => previous.concat(current), [])), // flattens change log arrays from multiple history entries
        O.filter(logs => logs.length !== 0), // if there are any change logs, then passes Option.some of change logs array
        O.map(changeLog => {return {id, key, changeLog}})
    )
}

function fromHistory(history:any, from: Date, to:Date): O.Option<ChangeLog[]>  {
    return pipe(
        O.option.of(history),
        O.filter(history => isDuring(new Date(history.created), from, to)), // if history is not created during update collection period than passes Option.none
        O.map(history => fromHistoryEntries(history.items, history.created))
    )
}

function fromHistoryEntries(entries: any[], timeStamp: string): ChangeLog[] {
    return array.filterMap(entries, entry => {
        let {field, fieldId, from, fromString, to, toString} = entry;
        return pipe(
            O.fromNullable(ChangelogFilter[field] || ChangelogFilter[fieldId]),
            O.fold(() => warnUnmappedField(field, fieldId),
                    filter => O.some(filter)),
            O.filter(filter => filter.use),
            O.map(filter => {return {type: filter.type, timeStamp, from, fromString, to, toString}})
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

function isDuring(timeStamp: Date, from: Date, to: Date): boolean {
    return timeStamp >= from && timeStamp < to
}
