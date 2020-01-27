import {TicketBoardInfo, TicketBoardIntegrationFailure} from "../../domain/product/TicketBoardIntegration";
import {Either, left, right} from "fp-ts/lib/Either";

export function translateProjectAssertResponse(status: number, data?: any): Promise<Either<TicketBoardIntegrationFailure, TicketBoardInfo>>{
    return new Promise<Either<TicketBoardIntegrationFailure, TicketBoardInfo>>(resolve => {
            if(status===200) {
                resolve(right({
                    id: data.id,
                    key: data.key,
                    name: data.name,
                    description: data.description,
                    category: {
                        id: data.category.id,
                        name: data.category.name,
                        description: data.category.description
                    }
                }))
            } else {
                switch (status) {
                    case 401:
                        resolve(left(new TicketBoardIntegrationFailure(
                            "project is not found or the user does not have permission to view it")));
                        return;
                    case 404:
                        resolve(left(new TicketBoardIntegrationFailure(
                            "project is not found or the user does not have permission to view it")));
                        return;
                    default:
                        resolve(left(new TicketBoardIntegrationFailure(
                            `project assert failed with unknown jira API error status code ${status}`)));
                        return;
                }
            }
    })
}
