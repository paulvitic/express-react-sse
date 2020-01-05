import { themeReducer } from './themeReducer';
import {DO_NOTHING} from "./actionTypes";

export const mainReducer = (webSocket) => {
    return (state, action) => {
        // middleware goes here, i.e calling analytics service, etc.
        console.log(`state is ${JSON.stringify(state)}, action is ${JSON.stringify(action)}`);

        const { theme } = state;

        if(action.type === DO_NOTHING){
            webSocket.send(JSON.stringify(action));
            return state;
        } else {
            return {
                ...state,
                theme: themeReducer(theme, action),
            };
        }
    }
};
