import {TOGGLE_LISTENING} from "../reducers/actionTypes";

export const serverSentEvents = (dispatch) => {
    console.log("invoked server side events function");
    let connTryCount = 0;
    let sse = null;

    const close = () => {
        if (sse!==null){
            console.log(`closing`);
            sse.close();
            sse = null;
            dispatch({type:TOGGLE_LISTENING, payload:false});
        }
    };

    const connect = () => {
        if (sse===null) {
            connTryCount++;
            if (connTryCount < 5){
                sse = new EventSource('http://localhost:3000/events');
                sse.onerror = () => {
                    console.log(`sse error`);
                    close();
                };
                sse.onopen = () => {
                    console.log(`sse opened`);
                    dispatch({type:TOGGLE_LISTENING, payload:true});
                };
                sse.onmessage = (event) => {
                    console.log(`sse message received: ${JSON.stringify(event)}`);
                    dispatch(JSON.parse(event.data));
                };
            }
        }
    };

    return {
        connect,
        close
    }
};
