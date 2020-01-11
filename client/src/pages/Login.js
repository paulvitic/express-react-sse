import React from "react";
import {Column, Row} from "../components/grid";

const queryParams = `client_id=883505003275-m819381prdb0s3dhl31r3kidmu4ocfj5.apps.googleusercontent.com&
redirect_uri=http://localhost:3000&
scope=https://www.googleapis.com/auth/userinfo.profile&
response_type=code&
access_type=offline&
prompt=consent`;

const googleLoginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams}`;

export function Login() {
    // TODO check if you are already logged in and if yes redirect to referer
    return (
        <Row>
            <Column xs={12} sm={1}/>
            <Column xs={12} sm={10}>
                <a href={googleLoginUrl}>
                    Login with Google
                </a>
            </Column>
            <Column xs={12} sm={1}/>
        </Row>
    );
}
