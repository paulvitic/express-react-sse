import {themeReducer} from './themeReducer';
import { DO_NOTHING } from "./actionTypes";
import {sseReducer} from "./sseReducer";
import {userReducer} from "./userReducer";

export const mainReducer = (state, action) => {
    // middleware goes here, i.e calling analytics service, etc.
    console.log(`state is ${JSON.stringify(state)}, action is ${JSON.stringify(action)}`);

    const {user, listening, theme} = state;

    switch (action.type) {
        case DO_NOTHING:
            return state;
        default:
            return {
                ...state,
                user: userReducer(user, action),
                theme: themeReducer(theme, action),
                listening: sseReducer(listening, action),
            };
    }
};

