import QueryService from "./QueryService";
import {KeyValueStore} from "./KeyValueStore";
import LogFactory from "../context/LogFactory";

export type Session = {
    id: string
    isSynced: boolean
    user: string
    email: string
}

export default class SessionsQueryService extends QueryService {
    private readonly log = LogFactory.get(SessionsQueryService.name);

    constructor(private readonly store: KeyValueStore<string, string>) {
        super();
    }

    byId = (id: string): Promise<Session> => {
        this.log.info(`id is ${id}`);
        return new Promise<Session>((resolve, reject) => {
            const session = this.store.get(id);
            this.log.info(`session is ${JSON.stringify(session)}`);
            return resolve({id, isSynced:true, user:"nnn", email:"ssss"})
        })
    }
}
