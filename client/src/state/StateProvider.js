import React, {createContext, useEffect, useContext, useReducer, useMemo} from 'react';
import {mainReducer} from "../reducers";
import {TOGGLE_LISTENING} from "../reducers/actionTypes";
import {serverSentEvents} from "./serverSentEvents";

const StateContext = createContext();

// useReducer accepts reducer function of type (state, action) => newState,
// and returns the current state paired with a dispatch method.
export const StateProvider = ({initialState, children}) => {
    console.log("state provider invoked.");
    const [state, dispatch] = useReducer(mainReducer, initialState);

    const sse = useMemo(() => {
        console.log(`sse usememo invoked.`);
        return serverSentEvents(dispatch);
    }, [dispatch]);

    const { listening } = state;

    useEffect( () => {
        console.log(`sse useeffect invoked.`);
        if (!listening) {
            console.log(`calling sse connect`);
            sse.connect();
        }
    }, [sse, listening]);

    return (
        <StateContext.Provider value={[state, dispatch]}>
            {children}
        </StateContext.Provider>
    )
};

export const useStateValue = () => useContext(StateContext); // returns the current context value for StateContext
