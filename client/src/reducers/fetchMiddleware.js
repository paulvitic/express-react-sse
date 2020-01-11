import {FETCH_USER, FETCH_PROJECTS, AUTH_USER} from "./actionTypes";

export default (dispatch) => {
    return (action) => {
        switch (action.type) {
            case FETCH_USER:
                fetch(`/api/v1/users?session=true`)
                    .then((response) => {
                        response.json()
                            .then((body) => {
                                console.log(body);
                                dispatch({
                                    type: action.type,
                                    payload:{
                                        isLoading:false,
                                        ...body,
                                    }
                                });
                            });
                    });
                break;
            case AUTH_USER:
                fetch(`/api/v1/users/auth?code=${action.payload}`)
                    .then((response) => {
                        response.json()
                            .then((body) => {
                                dispatch({type: action.type, payload: body})
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
