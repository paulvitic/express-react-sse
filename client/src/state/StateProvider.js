import React, {createContext, useEffect, useContext, useReducer, useState} from 'react';
import {mainReducer} from "../reducers";
import {TOGGLE_LISTENING} from "../reducers/actionTypes";
import {serverSentEvents} from "./serverSentEvents";
import Cookie from "js-cookie";
import dispatchMiddleware from "../reducers/dispatchMiddleware";

const sid = () => {
    return Cookie.get("app.sid")
};

function init(initialState) {
    if (Object.keys(initialState).length === 0) {
        return {
            sid: sid(),
            listening: false,
            theme: { primary: 'blue' },
            prodDevProjects: [{
                id: "",
                name: "",
                startDate: ""
            }]
        };
    }
    return initialState;
}

const StateContext = createContext();

// useReducer accepts reducer function of type (state, action) => newState,
// and returns the current state paired with a dispatch method.
export const StateProvider = ({initialState, children}) => {
    const [state, dispatch] = useReducer(mainReducer, initialState, init);

    const {listening} = state;
    useEffect( () => {
        const sse = serverSentEvents(dispatch);
        //sse.addEventListener('message', function(event) {
        //                         dispatch(event.data) etc.....
        //                     }, false);
        if (!listening) {
            sse.connect();
        }
        return () => listening ? sse.close() : ()=>{};
    }, [listening, dispatch]);

    return (
        <StateContext.Provider value={[state, dispatchMiddleware(dispatch)]}>
            {children}
        </StateContext.Provider>
    )
};

export const useStateValue = () => useContext(StateContext); // returns the current context value for StateContext
