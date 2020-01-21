import {ProjectDetails, TicketBoardIntegrationFailure} from "../../domain/product/TicketBoardIntegration";
import {Except, withFailure, withSuccess} from "../../domain/Except";

export function translateProjectAssertResponse(status: number, data?: any): Promise<Except<TicketBoardIntegrationFailure, ProjectDetails>>{
    return new Promise<Except<TicketBoardIntegrationFailure, ProjectDetails>>(resolve => {
            if(status===200) {
                resolve(withSuccess({
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
                        resolve(withFailure({
                            type: "",
                            reason: "project is not found or the user does not have permission to view it"
                        }));
                        return;
                    case 404:
                        resolve(withFailure({
                            type: "",
                            reason: "project is not found or the user does not have permission to view it"
                        }));
                        return;
                    default:
                        resolve(withFailure({
                            type: "",
                            reason: "project is not found or the user does not have permission to view it"
                        }));
                        return;
                }
            }
    })
}
