import {themeReducer} from './themeReducer';
import {DO_NOTHING, TOGGLE_LISTENING} from "./actionTypes";
import {sseReducer} from "./sseReducer";

export const mainReducer = (state, action) => {
    // middleware goes here, i.e calling analytics service, etc.
    console.log(`state is ${JSON.stringify(state)}, action is ${JSON.stringify(action)}`);

    const {listening, theme} = state;

    switch (action.type) {
        case DO_NOTHING:
            return state;
        default:
            return {
                ...state,
                theme: themeReducer(theme, action),
                listening: sseReducer(listening, action),
            };
    }
};

