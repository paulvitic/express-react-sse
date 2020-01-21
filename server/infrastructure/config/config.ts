import { config as environment} from 'dotenv';

export interface Environment {
    //NODE_ENV: string,
    APP_ID: string,
    PORT: number,
    LOG_LEVEL: string,
    REQUEST_LIMIT: string,
    SESSION_SECRET: string,
    POSTGRES_HOST: string,
    POSTGRES_PORT: number,
    POSTGRES_DATABASE: string,
    POSTGRES_USER: string,
    POSTGRES_PASS: string,
    REDIS_HOST: string,
    REDIS_PORT: number;
    REDIS_PASS: string,
    RABBIT_HOST: string,
    RABBIT_PORT: number;
    RABBIT_VHOST:string;
    RABBIT_USER: string,
    RABBIT_PASS: string,
    SWAGGER_API_SPEC: string,
    DATA_COLLECTION_CRON: string,
    API_PREFIX: string,
    SESSION_COOKIE_TTL: number,
    GOOGLE_APP_CLIENT_ID: string,
    GOOGLE_APP_CLIENT_SECRET: string
    JIRA_URL: string,
    JIRA_USER: string,
    JIRA_API_TOKEN: string
}

const getStringValueOrThrow = (objectVariables: NodeJS.ProcessEnv, key: string): string => {
    const value = objectVariables[key];
    if (value) {
        return value;
    }
    throw Error(`invalid value '${value}' for environment variable ${key}`);
};

const getArrayFromCommaSeparated = (value?: string): string[] => {
    return value && value.trim() ? value.split(',').map((item) => item.trim()) : [];
};

const envFound = environment();

if (!envFound) {
    throw new Error("Couldn't find .env file");
}

export default async function config(): Promise<Environment> {
    return {
        //NODE_ENV: getStringValueOrThrow(process.env, 'NODE_ENV'),
        APP_ID: getStringValueOrThrow(process.env, 'APP_ID'),
        PORT: process.env.PORT ? parseInt(process.env.PORT) : 4000,
        LOG_LEVEL: process.env.LOG_LEVEL || "info",
        REQUEST_LIMIT: getStringValueOrThrow(process.env, 'REQUEST_LIMIT'),
        SESSION_SECRET: getStringValueOrThrow(process.env, 'SESSION_SECRET'),
        POSTGRES_HOST: getStringValueOrThrow(process.env, 'POSTGRES_HOST'),
        POSTGRES_PORT:  process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
        POSTGRES_DATABASE: getStringValueOrThrow(process.env, 'POSTGRES_DATABASE'),
        POSTGRES_USER: getStringValueOrThrow(process.env, 'POSTGRES_USER'),
        POSTGRES_PASS: getStringValueOrThrow(process.env, 'POSTGRES_PASS'),
        REDIS_HOST:  process.env.REDIS_HOST || 'localhost',
        REDIS_PORT:  process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
        REDIS_PASS:  getStringValueOrThrow(process.env, 'REDIS_PASS'),
        RABBIT_HOST: getStringValueOrThrow(process.env, 'RABBIT_HOST'),
        RABBIT_PORT: process.env.RABBIT_PORT ? parseInt(process.env.RABBIT_PORT) : 5672,
        RABBIT_VHOST:getStringValueOrThrow(process.env, 'RABBIT_VHOST'),
        RABBIT_USER: getStringValueOrThrow(process.env, 'RABBIT_USER'),
        RABBIT_PASS: getStringValueOrThrow(process.env, 'RABBIT_PASS'),
        SWAGGER_API_SPEC: getStringValueOrThrow(process.env, 'SWAGGER_API_SPEC'),
        DATA_COLLECTION_CRON: process.env.DATA_COLLECTION_CRON || '* * * * *',
        API_PREFIX: process.env.API_PREFIX || '/api',
        SESSION_COOKIE_TTL: process.env.SESSION_COOKIE_TTL ? parseInt(process.env.SESSION_COOKIE_TTL) : 1000 * 60 * 60 * 24,
        GOOGLE_APP_CLIENT_ID: getStringValueOrThrow(process.env, 'GOOGLE_APP_CLIENT_ID'),
        GOOGLE_APP_CLIENT_SECRET: getStringValueOrThrow(process.env, 'GOOGLE_APP_CLIENT_SECRET'),
        JIRA_URL: getStringValueOrThrow(process.env, 'JIRA_URL'),
        JIRA_USER: getStringValueOrThrow(process.env, 'JIRA_USER'),
        JIRA_API_TOKEN: getStringValueOrThrow(process.env, 'JIRA_API_TOKEN'),
    };
}
