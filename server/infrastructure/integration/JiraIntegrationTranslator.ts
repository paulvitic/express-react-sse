import {TicketBoardInfo, TicketBoardIntegrationFailure} from "../../domain/product/TicketBoardIntegration";
import * as E from 'fp-ts/lib/Either'
import { AxiosResponse, AxiosError} from "axios";

export function toProjectInfo(resp: AxiosResponse<any>):
    E.Either<TicketBoardIntegrationFailure, TicketBoardInfo> {
    return E.tryCatch(
        () => {
            let { data } = resp;
            let { id, key, name, description, projectCategory } = data;
            return {id, key, name, description, category: {
                    id: projectCategory.id,
                    name: projectCategory.name,
                    description: projectCategory.description
                }
            }
        },
            reason => new TicketBoardIntegrationFailure(String(reason)))
}

export function toTicketInfoAssertionFailure(error: AxiosError): TicketBoardIntegrationFailure {
    let {response} = error;
    switch (response.status) {
        case 401:
            return new TicketBoardIntegrationFailure(
                "authentication credentials are incorrect or missing");
        case 404:
            return new TicketBoardIntegrationFailure(
                "project is not found or the user does not have permission to view it");
        default:
            return new TicketBoardIntegrationFailure(
                `project assert failed with unknown jira API error status code ${response.status}`);
    }
}
