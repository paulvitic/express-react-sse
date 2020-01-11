import React, {createContext, useEffect, useContext, useReducer, useState} from 'react';
import {mainReducer} from "../reducers";
import Cookie from "js-cookie";
import dispatchMiddleware from "../reducers/fetchMiddleware";
import {useStream} from "./useStream";

// TODO move state data structure and initialization function to another file
function init(initialState) {
    if (Object.keys(initialState).length === 0) {
            return {
                user: {
                    isLoading: true,
                    name: undefined
                },
                agent: {
                    appCodeName: navigator.appCodeName,
                    appName: navigator.appName,
                    appVersion: navigator.appVersion,
                    cookieEnabled: navigator.cookieEnabled,
                    language: navigator.language,
                    onLine: navigator.onLine,
                    platform: navigator.platform,
                    userAgent: navigator.userAgent
                },
                listening: false,
                theme: { primary: 'blue' },
                prodDevProjects: [{
                    id: "",
                    name: "",
                    startDate: ""
                }]
            }
    }

    return initialState;
}

const StateContext = createContext();

// useReducer accepts reducer function of type (state, action) => newState,
// and returns the current state paired with a dispatch method.
export const StateProvider = ({initialState, children}) => {
    const [state, dispatch] = useReducer(mainReducer, initialState, init);

    // TODO do this after syncing user and auth
    useStream(state.listening, dispatch);

    return (
        <StateContext.Provider value={[state, dispatchMiddleware(dispatch)]}>
            {children}
        </StateContext.Provider>
    )
};

export const useStateValue = () => useContext(StateContext); // returns the current context value for StateContext
