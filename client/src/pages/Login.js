import React, {useEffect} from "react";
import {Column, Row} from "../components/grid";
import { useHistory, useLocation } from "react-router-dom";
import {useStateValue} from "../context";
import config from "../config"

const {url, clientId, redirectUri, scope } = config.googleAuth;

const queryParams = `
client_id=${clientId}&
redirect_uri=${redirectUri}&
scope=${scope}&
response_type=code&
access_type=offline&
prompt=consent`;

export function Login() {
    let [{ user }] = useStateValue();

    let history = useHistory();
    let location = useLocation();

    let { from } = location.state || { from: { pathname: "/" } };
    let { name } = user;

    useEffect(() => {
        if (name) {
            history.replace(from);
        }
    }, [name, history, from]);

    return (
        <Row>
            <Column xs={12} sm={1}/>
            <Column xs={12} sm={10}>
                <a href={`${url}?${queryParams}`}>
                    Login with Google
                </a>
            </Column>
            <Column xs={12} sm={1}/>
        </Row>
    );
}
