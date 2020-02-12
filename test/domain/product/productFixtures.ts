import {TicketBoardInfo} from "../../../server/domain/product/TicketBoardIntegration";
import TicketBoard from "../../../server/domain/product/TicketBoard";

export const DEVELOPMENT_PROJECT_ID_FIXTURE = "dev-project-1";
export const TICKET_BOARD_ID_FIXTURE = "ticket-board-1";
export const EXTERNAL_KEY_FIXTURE = "TEST";
export const PROJECT_NAME_FIXTURE = "Fixture Project";
export const PROJECT_DESCRIPTION_FIXTURE = "Fixture Project";

export const PROJECT_INFO_FIXTURE: TicketBoardInfo = {
    id: 1000,
    key: EXTERNAL_KEY_FIXTURE,
    name: PROJECT_NAME_FIXTURE,
    description: PROJECT_DESCRIPTION_FIXTURE,
    projectCategory: {
        id: 1001,
        name: TicketBoard.DEV_PROJECT_CATEGORY,
        description: "",
    }
};

