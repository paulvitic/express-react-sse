import React from "react";
import {useStateValue} from "../context";
import { Route, Redirect, useHistory, useLocation } from "react-router-dom";

export function PrivateRoute({ children, location, ...rest }) {
    const [{ session }, dispatch] = useStateValue();

    const search = location.search;
    const params = new URLSearchParams(search);
    console.log(`code is; ${params.get("code")}`);

    // TODO here use dispatch to call server with code

    return (
        <Route {...rest} location={location} render={({ location }) =>
            session.user ? (
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
}
