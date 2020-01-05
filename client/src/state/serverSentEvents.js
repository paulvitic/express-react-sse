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
                sse = new EventSource('http://localhost:3000/events');
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
            }
        }
    }

    return {
        connect,
        close
    }
};
