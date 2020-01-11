import {FETCH_SESSION, FETCH_PROJECTS} from "./actionTypes";

export default (dispatch) => {
    return (action) => {
        switch (action.type) {
            case FETCH_SESSION:
                fetch(`/api/v1/sessions/${action.payload.id}`)
                    .then((response) => {
                        response.json()
                            .then((data) => {
                                console.log(data);
                                dispatch({type: action.type, payload:data});
                            });
                    });
                break;
            case FETCH_PROJECTS:
                fetch("/api/v1/projects")
                    .then(() => dispatch(action));
                break;
            default:
                return dispatch(action);
        }
    };
}
