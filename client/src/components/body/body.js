import React, {useEffect} from "react";
import {Home, Login, PrivateRoute} from "../../pages";
import {useStateValue} from "../../context";
import {Route, Switch } from 'react-router-dom';
import {FETCH_SESSION} from "../../reducers/actionTypes";

const Body = () => {
    const [{ session }, dispatch] = useStateValue();

    useEffect(() => {
        if (!session.synced) dispatch({type:FETCH_SESSION, payload: session.id});
    }, [session.synced, dispatch]);

    if (session.synced) {
        return (
            <Switch>
                <Route path="/login">
                    <Login />
                </Route>
                <PrivateRoute path="/">
                    <Home />
                </PrivateRoute>
            </Switch>
        )
    } else {
        return (
            <h2>getting session info</h2>
        )
    }
};

export default Body;
