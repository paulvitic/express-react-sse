import {
    ChangeLog,
    TicketBoardInfo,
    TicketChangeLog,
    UpdatedTicket
} from "../../../server/domain/product/service/TicketBoardIntegration";
import TicketBoard from "../../../server/domain/product/TicketBoard";
import {NextTicketUpdateCollectionPeriod} from "../../../server/domain/product/view/NextTicketUpdateCollectionPeriod";
import TicketUpdateCollection, {TicketUpdateCollectionPeriod} from "../../../server/domain/product/TicketUpdateCollection";
import {UpdatedTicketsListFetched} from "../../../server/domain/product/event";

export const PRODUCT_DEV_ID_FIXTURE = "product-dev-1";
export const PRODUCT_DEV_STARTED_ON_FIXTURE = new Date("2018-11-27T00:00:00.000");
export const TICKET_BOARD_ID_FIXTURE = "ticket-board-1";
export const TICKET_BOARD_KEY_FIXTURE = "TEST";
export const PRODUCT_DEV_NAME_FIXTURE = "Fixture Project";
export const PRODUCT_DEV_DESCRIPTION_FIXTURE = "Fixture Project description";
export const TICKET_UPDATE_COLL_ID_FIXTURE = "ticket-update-coll-1";
export const TICKET_UPDATE_COLL_FROM_FIXTURE = new Date("2018-11-27T00:00:00.000");
export const TICKET_UPDATE_COLL_TO_FIXTURE = new Date("2018-11-28T00:00:00.000");
export const TICKET_UPDATE_COLLECTION_ID_FIXTURE = "ticket-update-collection-1";
export const TICKET_KEY_FIXTURE_0 = "TEST-TICKET-0";
export const TICKET_KEY_FIXTURE_1 = "TEST-TICKET-1";


export const PROJECT_INFO_FIXTURE: TicketBoardInfo = {
    id: 1000,
    key: TICKET_BOARD_KEY_FIXTURE,
    name: PRODUCT_DEV_NAME_FIXTURE,
    description: PRODUCT_DEV_DESCRIPTION_FIXTURE,
    created: PRODUCT_DEV_STARTED_ON_FIXTURE,
    projectCategory: {
        id: 1001,
        name: TicketBoard.PRODUCT_DEV_PROJECT_CATEGORY,
        description: "",
    }
};

export const NEXT_COLLECTION_PERIOD_FIXTURE: NextTicketUpdateCollectionPeriod = {
    devProjectId: PRODUCT_DEV_ID_FIXTURE,
    ticketBoardKey: TICKET_BOARD_KEY_FIXTURE,
    devProjectStartedOn: PRODUCT_DEV_STARTED_ON_FIXTURE,
    lastTicketUpdateCollectionPeriodEnd: null
};

export const UPDATED_TICKET_FIXTURE_0: UpdatedTicket = {
    id:1001,
    key:TICKET_KEY_FIXTURE_0
};

export const UPDATED_TICKET_FIXTURE_1: UpdatedTicket = {
    id:1002,
    key:TICKET_KEY_FIXTURE_1
};

export const TICKET_UPDATE_COLLECTION_PERIOD_FIXTURE = new TicketUpdateCollectionPeriod(PRODUCT_DEV_STARTED_ON_FIXTURE);

export const TICKET_CHANGELOG_0: TicketChangeLog ={
    id: 1001,
    key: TICKET_KEY_FIXTURE_0,
    changeLog:[{
        field: "",
        timeStamp: PRODUCT_DEV_STARTED_ON_FIXTURE,
        from: "",
        fromString: "",
        to: "",
        toString: "",
    },{
        field: "",
        timeStamp: PRODUCT_DEV_STARTED_ON_FIXTURE,
        from: "",
        fromString: "",
        to: "",
        toString: "",
    }]
};

export const TICKET_CHANGELOG_1: TicketChangeLog = {
    id: 1002,
    key: TICKET_KEY_FIXTURE_1,
    changeLog:[{
        field: "",
        timeStamp: PRODUCT_DEV_STARTED_ON_FIXTURE,
        from: "",
        fromString: "",
        to: "",
        toString: "",
    },{
        field: "",
        timeStamp: PRODUCT_DEV_STARTED_ON_FIXTURE,
        from: "",
        fromString: "",
        to: "",
        toString: "",
    }]
};

export const UPDATED_TICKETS_LIST_FETCHED_FIXTURE = new UpdatedTicketsListFetched(
    TicketUpdateCollection.name,
    TICKET_UPDATE_COLLECTION_ID_FIXTURE,
    PRODUCT_DEV_ID_FIXTURE,
    TICKET_KEY_FIXTURE_0,
    TICKET_UPDATE_COLLECTION_PERIOD_FIXTURE,
    [UPDATED_TICKET_FIXTURE_0, UPDATED_TICKET_FIXTURE_1]
);

