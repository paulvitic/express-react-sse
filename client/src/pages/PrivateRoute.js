import React, {useEffect, useMemo} from "react";
import {useStateValue} from "../context";
import { Route, Redirect } from "react-router-dom";
import {AUTH_USER, FETCH_USER} from "../reducers/actionTypes";
import {Loader} from "../components/loader";

export const PrivateRoute = ({ children, location, ...rest }) => {
    let [{ user }, dispatch] = useStateValue();

    let code = useMemo(() => {
        if (location.pathname === "/") {
            return new URLSearchParams(location.search).get("code");
        }
    }, [location]);

    useEffect( () => {
        if (user.isLoading) {
            dispatch({ type:FETCH_USER })
        } else if (!user.name && code) {
            dispatch({ type: AUTH_USER, payload: code} )
        }
    }, [user, dispatch, code]);

    return (
        user.isLoading ?
            <Loader/> :
            <Route {...rest} location={location} render={({ location }) =>
                user.name ?
                    (
                        children
                    ) :
                    (
                        <Redirect
                            to={{
                                pathname: "/login",
                                state: { from: location }
                            }}
                        />
                    )
                }
            />
    );
};
