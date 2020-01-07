
// wrapper over main dispatch can be used for async actions
export default (dispatch) => {
    return (action) => {
        switch (action.type) {
            case 'DELETE_FILE':
                fetch(action.url).then(() => dispatch(action));
                break;
            default:
                return dispatch(action);
        }
    };
}
