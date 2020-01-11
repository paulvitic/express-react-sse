import { FETCH_SESSION } from "./actionTypes"

export const sessionReducer = (state, action) => {
    switch (action.type) {
        case FETCH_SESSION:
            return action.payload;
        default:
            return state;
    }
};
