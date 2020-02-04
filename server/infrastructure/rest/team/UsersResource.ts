import WinstonLogFactory from "../../context/WinstonLogFactory";
import {Request, Response} from "express";
import axios from 'axios'

type AccessToken = {
    access_token,
    expires_in,
    token_type,
    refresh_token
}

type UserInfo = {
    id,
    email,
    given_name,
    family_name
}

export const UsersEndpoints = {
    authenticate: "AuthenticateUser",
    search: "SearchUser",
    create: "CreateUser"
};

export class UsersResource {
    private readonly log = WinstonLogFactory.get(UsersResource.name);

    constructor(private readonly googleAppClientId: string,
                private readonly googleAppClientSecret: string){}

    // Command
    create = (req: Request, res: Response): void => {
        throw new Error('not implemented')
    };

    authenticate = (req: Request, res: Response): void => {
        this.log.info(`authenticating with ${req.query.code}`);
        this.accessToken(req.query.code)
            .then(auth => {
                req.session.auth = auth;
                this.userInfo(auth.access_token)
                    .then(user => {
                        if (user) {
                            req.session.user = user;
                            res.json(user);
                        } else {
                            res.status(404).end();
                        }
                    })
            })
    };


    // Query
    byId = (req: Request, res: Response): void => {

    };

    search = (req: Request, res: Response): void => {
        if (req.query.session) {
            this.log.info(`session is ${JSON.stringify(req.session)}`);
            this.log.info(`session id is ${req.session.id}`);
            if (req.session.user) res.json(req.session.user);
            else res.json({});
        } else {
            res.json({});
        }
    };


    private accessToken = async (code:string): Promise<AccessToken> => {
        return new Promise<AccessToken>((resolve, reject) => {
            axios("https://oauth2.googleapis.com/token", {
                method: 'POST',
                data: {
                    client_id: this.googleAppClientId,
                    client_secret: this.googleAppClientSecret,
                    redirect_uri: 'http://localhost:3000',
                    grant_type: 'authorization_code',
                    code,
                },
            }).then(resp => {
                resolve(resp.data);
            }).catch(err => {
                this.log.error(`err`, err)
                reject(err);
            })
        })
    };

    private userInfo = async (accessToken: string): Promise<UserInfo> => {
        return new Promise<UserInfo>((resolve, reject) => {
            axios("https://www.googleapis.com/oauth2/v2/userinfo", {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            }).then(resp => {
                resolve(resp.data);
            }).catch(err => {
                reject(err);
            })
        })
    }
}
