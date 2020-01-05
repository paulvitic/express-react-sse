import { TOGGLE_LISTENING } from "./actionTypes"

export const sseReducer = (state, action) => {
    switch (action.type) {
        case TOGGLE_LISTENING:
            return action.payload;
        default:
            return state;
    }
};
