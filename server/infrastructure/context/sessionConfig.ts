import {Application} from "express";
import uuid from "../../domain/uuid";
import connectRedis, {RedisStore} from "connect-redis";
import session from "express-session";

export default (app: Application) => {

    const sessionStore = (): RedisStore => {
        const redisStore = connectRedis(session);
        return  new redisStore({
            host: this.host,
            port: this.port,
            db: 0,
            client: app.get('redisClient'),
            ttl:  app.get('sessionCookieTtl')
        });
    };

    const sess = {
        name: 'app.sid', // use process.env.SESSION_NAME some obscure name
        secret: process.env.SESSION_SECRET,
        store: sessionStore(),
        cookie: {
            httpOnly: true, // means you can not access session data with javascript
            secure: false, // make it true for production
            maxAge: app.get("sessionCookieTtl")
        },
        genid: function(req) {
            return `${app.get("instanceId")}:${uuid()}`;
        },
        saveUninitialized: true,
        resave: false,
        rolling: false
    };

    if (app.get('env') === 'production') {
        app.set('trust proxy', 1); // trust first proxy, this is not about session config or?
        sess.cookie.secure = true // serve secure cookies
    }

    return sess;
};
