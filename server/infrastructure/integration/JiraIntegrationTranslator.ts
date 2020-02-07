import {TicketBoardInfo, TicketBoardIntegrationFailure} from "../../domain/product/TicketBoardIntegration";
import * as E from 'fp-ts/lib/Either'
import { AxiosResponse, AxiosError} from "axios";

export function toProjectInfo({ data }: AxiosResponse<any>):
    E.Either<TicketBoardIntegrationFailure, TicketBoardInfo> {
    return E.tryCatch(
        () => {
            let { id, key, name, description, projectCategory } = data;
            return {id, key, name, description, projectCategory}
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
