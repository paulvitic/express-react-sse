import {AUTH_USER, FETCH_USER} from "./actionTypes"

export const userReducer = (state, action) => {
    switch (action.type) {
        case FETCH_USER:
            return action.payload;
        case AUTH_USER:
            return {
                ...state,
                ...action.payload
            };
        default:
            return state;
    }
};
