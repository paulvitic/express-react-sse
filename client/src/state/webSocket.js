import Cookie from "js-cookie";

console.log("creating socket");

const webSocket = new WebSocket("ws://localhost:3000");

webSocket.onerror = (event) => {
    console.error("WebSocket error observed:", event);
};

webSocket.onopen = (event) => {
    console.log(`connection opened: type ${event.type}`);
    webSocket.send(JSON.stringify({type: "CONNECTION_RESPONSE", payload: `${Cookie.get("app.sid")} connected`}));
};

export const createSocket = () => {
    console.log("invoked creat socket");
    return {
        send: (msg) => webSocket.send(msg),
        onmessage: (dispatch) => {
            console.log("invoked ws onmessage");
            webSocket.onmessage = (event) => {
                console.log(`server message received: origin ${event.origin}, last id ${event.lastEventId}, data ${event.data}`);
                const action = JSON.parse(event.data);
                if (action.type === "SERVER_CONNECTION") return;
                dispatch(action);
            };
        }
    }
};
