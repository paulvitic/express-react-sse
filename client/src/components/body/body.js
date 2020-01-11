import React, {useEffect} from "react";
import {Home, Login, PrivateRoute} from "../../pages";
import {useStateValue} from "../../context";
import {Route, Switch, useLocation } from 'react-router-dom';
import {FETCH_USER, AUTH_USER} from "../../reducers/actionTypes";


const Body = () => {
    const [{ user }, dispatch] = useStateValue();

    useEffect(() => {
        if (user.isLoading) dispatch({type:FETCH_USER});
    }, [user.isLoading, dispatch]);

    if (!user.isLoading) {
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
            <h2>Getting user info</h2>
        )
    }
};

export default Body;
