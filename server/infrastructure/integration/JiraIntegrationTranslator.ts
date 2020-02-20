import {
    TicketBoardInfo,
    TicketBoardIntegrationFailure,
    UpdatedTicket
} from "../../domain/product/service/TicketBoardIntegration";
import * as E from 'fp-ts/lib/Either'
import { AxiosResponse, AxiosError} from "axios";

export function toProjectInfo({ data }: AxiosResponse<any>):
    E.Either<TicketBoardIntegrationFailure, TicketBoardInfo> {
    return E.tryCatch(
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
    return E.tryCatch(
        () => {
            if (data.total === 0) return [];
            let updates = new Array<UpdatedTicket>();
            let {issues} = data;
            for (let issue of issues) {
                let {id, key, fields: {updated, created}} = issue;
                updates.push({id, key, updated: new Date(updated), created: new Date(created)})
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

function toBeginningOfDay(dateString: string): Date{
    let date = new Date(dateString);
    date.setHours(0,0,0,0);
    return date;
}

export function toQueryDateFormat(date: Date): string {
    const d = date.getDate();
    const m = date.getMonth() + 1; //Month from 0 to 11
    const y = date.getFullYear();
    return `${y}%2F${ m<=9 ? '0'+m : m }%2F${ d <= 9 ? '0'+d : d}`;
}
