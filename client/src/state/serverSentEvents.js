import {TOGGLE_LISTENING} from "../reducers/actionTypes";

export const serverSentEvents = (dispatch) => {
    let connTryCount = 0;
    let sse = null;

    function close(){
        if (sse!==null){
            console.log("closing server sent events connection");
            sse.close();
            sse = null;
            dispatch({type:TOGGLE_LISTENING, payload:false});
        }
    }

    function connect() {
        if (sse===null) {
            console.log("starting server sent events connection");
            connTryCount++;
            if (connTryCount < 5){
                //see: https://www.html5rocks.com/en/tutorials/eventsource/basics/
                if (!!window.EventSource) {
                    sse = new EventSource('events');
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
                    sse.onerror = () => {
                        console.log(`server sent events connection error`);
                        close();
                    };
                    sse.onopen = (event) => {
                        console.log(`server sent events connection opened ${JSON.stringify(event)}`);
                        dispatch({type:TOGGLE_LISTENING, payload:true});
                    };
                    sse.onmessage = (event) => {
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
