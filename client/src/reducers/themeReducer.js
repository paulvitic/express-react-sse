import { CHANGE_THEME } from "./actionTypes"

export const themeReducer = (state, action) => {
    switch (action.type) {
        case CHANGE_THEME:
            return {
                ...state,
                primary: action.payload
            };
        default:
            return state;
    }
};
