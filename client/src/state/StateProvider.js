import React, {createContext, useCallback, useContext, useReducer, useMemo} from 'react';
import {mainReducer} from "../reducers";
import {createSocket} from "./webSocket";
import Cookie from "js-cookie";
import {CHANGE_THEME, DO_NOTHING} from "../reducers/actionTypes";

const StateContext = createContext();

// useReducer accepts reducer function of type (state, action) => newState,
// and returns the current state paired with a dispatch method.
export const StateProvider = ({initialState, children}) => {
    console.log("state provider invoked.");

    const ws = useMemo(() => {
        console.log("invoked useMemo create web socket");
        return createSocket();
    }, []);

    const [state, dispatch] = useReducer(mainReducer(ws), initialState);

    useMemo (()=> {
        console.log("invoked useMemo ws on message");
        ws.onmessage(dispatch);
    }, [ws, dispatch]);

    return (
        <StateContext.Provider value={[state, dispatch]}>
            {children}
        </StateContext.Provider>
    )
};

export const useStateValue = () => useContext(StateContext); // returns the current context value for StateContext
