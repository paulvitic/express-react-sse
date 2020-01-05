import {Application} from "express";
import uuid from "uuid";

export default (app: Application) => {

    const sess = {
        name: 'app.sid',
        secret: process.env.SESSION_SECRET,
        store: app.get('sessionStore'),
        cookie: {
            httpOnly: false,
            secure: false,
            maxAge: app.get("sessionCookieTtl")
        },
        genid: function(req) {
            return uuid.v4();
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
