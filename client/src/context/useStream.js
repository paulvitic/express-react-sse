import React, {useEffect} from "react";
import {TOGGLE_LISTENING} from "../reducers/actionTypes";

const eventSource = (dispatch) => {
    let connection = null, connTryCount = 0;

    function close(){
        if (connection!==null){
            console.log("closing server sent events connection");
            connection.close();
            connection = null;
            dispatch({type:TOGGLE_LISTENING, payload:false});
        }
    }

    function connect() {
        if (connection===null) {
            console.log("starting server sent events connection");
            connTryCount++;
            if (connTryCount < 5){
                //see: https://www.html5rocks.com/en/tutorials/eventsource/basics/
                if (!!window.EventSource) {
                    connection = new EventSource('/events');
                    /*sse.addEventListener('message', function(e) {
                        console.log(e.data);
                    }, false);

                    sse.addEventListener('open', function(e) {
                        // Connection was opened.
                    }, false);

                    sse.addEventListener('error', function(e) {
                        if (e.readyState === EventSource.CLOSED) {
                            // Connection was closed.
                        }
                    }, false);*/
                    connection.onerror = () => {
                        console.log(`server sent events connection error`);
                        close();
                    };
                    connection.onopen = (event) => {
                        console.log(`server sent events connection opened ${JSON.stringify(event)}`);
                        dispatch({type:TOGGLE_LISTENING, payload:true});
                    };
                    connection.onmessage = (event) => {
                        console.log(`sse event received ${JSON.stringify(event)} with data ${event.data}`);
                        dispatch(JSON.parse(event.data));
                    };
                } else {
                    // TODO Result to xhr polling :(
                }
            }
        }
    }

    return {
        connect,
        close
    }
};

export const useStream = (listening, dispatch) => {
    useEffect( () => {
        let {close, connect} = eventSource(dispatch);
        if (!listening) {
            connect();
        }
        return () => !listening ? () => {} : close();
    }, [listening, dispatch]);
};
