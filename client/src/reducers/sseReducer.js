import { TOGGLE_LISTENING } from "./actionTypes"

export const sseReducer = (state, action) => {
    console.log(`state is ${JSON.stringify(state)}, action is ${JSON.stringify(action)}`);
    switch (action.type) {
        case TOGGLE_LISTENING:
            return action.payload;
        default:
            return state;
    }
};
