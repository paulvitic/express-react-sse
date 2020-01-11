import React, {useEffect} from "react";
import {useStateValue} from "../context";
import { Route, Redirect, useHistory, useLocation, useParams } from "react-router-dom";
import { AUTH_USER } from "../reducers/actionTypes";


export const PrivateRoute = ({ children, location, ...rest }) => {
    const [{ user }, dispatch] = useStateValue();

    useEffect(() => {
        if (!user.name && location.pathname === "/") {
            const code = new URLSearchParams(location.search).get("code");
            if (code) dispatch({type: AUTH_USER, payload: code})
        }
    }, [user.name, location, dispatch]);

    console.log(`re-rendering with user name ${user.name}`);
    return (
        <Route {...rest} location={location} render={({ location }) =>
            user.name ? (
                    children
                ) : (
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
