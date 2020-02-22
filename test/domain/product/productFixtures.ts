import {TicketBoardInfo, UpdatedTicket} from "../../../server/domain/product/service/TicketBoardIntegration";
import TicketBoard from "../../../server/domain/product/TicketBoard";
import {NextTicketUpdateCollectionPeriod} from "../../../server/domain/product/view/NextTicketUpdateCollectionPeriod";

export const DEV_PROJECT_ID_FIXTURE = "dev-project-1";
export const DEV_PROJECT_STARTED_ON_FIXTURE = new Date("2018-11-27T00:00:00.000");
export const TICKET_BOARD_ID_FIXTURE = "ticket-board-1";
export const TICKET_BOARD_KEY_FIXTURE = "TEST";
export const DEV_PROJECT_NAME_FIXTURE = "Fixture Project";
export const DEV_PROJECT_DESCRIPTION_FIXTURE = "Fixture Project description";
export const TICKET_UPDATE_COLL_ID_FIXTURE = "ticket-update-coll-1";
export const TICKET_UPDATE_COLL_FROM_FIXTURE = new Date("2018-11-27T00:00:00.000");
export const TICKET_UPDATE_COLL_TO_FIXTURE = new Date("2018-11-28T00:00:00.000");
export const TICKET_UPDATE_COLLECTION_ID_FIXTURE = "ticket-update-collection-1";
export const TICKET_KEY_FIXTURE = "TEST-TICKET";

export const PROJECT_INFO_FIXTURE: TicketBoardInfo = {
    id: 1000,
    key: TICKET_BOARD_KEY_FIXTURE,
    name: DEV_PROJECT_NAME_FIXTURE,
    description: DEV_PROJECT_DESCRIPTION_FIXTURE,
    created: DEV_PROJECT_STARTED_ON_FIXTURE,
    projectCategory: {
        id: 1001,
        name: TicketBoard.DEV_PROJECT_CATEGORY,
        description: "",
    }
};

export const NEXT_COLLECTION_PERIOD_FIXTURE: NextTicketUpdateCollectionPeriod = {
    devProjectId: DEV_PROJECT_ID_FIXTURE,
    ticketBoardKey: TICKET_BOARD_KEY_FIXTURE,
    devProjectStartedOn: DEV_PROJECT_STARTED_ON_FIXTURE,
    lastTicketUpdateCollectionPeriodEnd: null
};

export const UPDATED_TICKET_FIXTURE: UpdatedTicket = {
    id:1001,
    key:TICKET_KEY_FIXTURE,
    updated: TICKET_UPDATE_COLL_FROM_FIXTURE,
    created: TICKET_UPDATE_COLL_FROM_FIXTURE
};


