import {FETCH_USER, FETCH_PROJECTS, AUTH_USER} from "./actionTypes";

const filter = (dispatch, type, responsePromise) => {
    responsePromise
        .then((response) => {
            response.json()
                .then((payload) => {
                    dispatch({type, payload})
                });
        });
};

export default (dispatch) => {
    return (action) => {
        switch (action.type) {
            case FETCH_USER:
                filter(dispatch, action.type, fetch(`/api/v1/users?session=true`));
                break;
            case AUTH_USER:
                filter(dispatch, action.type, fetch(`/api/v1/users/auth?code=${action.payload}`));
                break;
            case FETCH_PROJECTS:
                filter(dispatch, action.type, fetch("/api/v1/projects"));
                break;
            default:
                return dispatch(action);
        }
    };
}
