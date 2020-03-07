import { config as environment} from 'dotenv';
import {RabbitClientParams} from "../clients/RabbitClient";
import {JiraIntegrationParams} from "../integration/JiraIntegration";
import {PostgresClientParams} from "../clients/PostgresClient";
import {RedisClientParams} from "../clients/RedisClient";

export interface Environment {
    NODE_ENV: string,
    APP_ID: string,
    PORT: number,
    LOG_LEVEL: string,
    REQUEST_LIMIT: string,
    SESSION_SECRET: string,
    POSTGRES_PARAMS: PostgresClientParams,
    REDIS_PARAMS: RedisClientParams,
    RABBIT_PARAMS: RabbitClientParams
    SWAGGER_API_SPEC: string,
    DATA_COLLECTION_CRON: string,
    API_PREFIX: string,
    SESSION_COOKIE_TTL: number,
    GOOGLE_APP_CLIENT_ID: string,
    GOOGLE_APP_CLIENT_SECRET: string
    JIRA_PARAMS: JiraIntegrationParams
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
        NODE_ENV: getStringValueOrThrow(process.env, 'NODE_ENV'),
        APP_ID: getStringValueOrThrow(process.env, 'APP_ID'),
        PORT: process.env.PORT ? parseInt(process.env.PORT) : 4000,
        LOG_LEVEL: process.env.LOG_LEVEL || "info",
        REQUEST_LIMIT: getStringValueOrThrow(process.env, 'REQUEST_LIMIT'),
        SESSION_SECRET: getStringValueOrThrow(process.env, 'SESSION_SECRET'),
        POSTGRES_PARAMS: {
            host: getStringValueOrThrow(process.env, 'POSTGRES_HOST'),
            port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
            database: getStringValueOrThrow(process.env, 'POSTGRES_DATABASE'),
            user: getStringValueOrThrow(process.env, 'POSTGRES_USER'),
            password: getStringValueOrThrow(process.env, 'POSTGRES_PASS')
        },
        REDIS_PARAMS: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
            password: getStringValueOrThrow(process.env, 'REDIS_PASS')
        },
        RABBIT_PARAMS: {
            host : getStringValueOrThrow(process.env, 'RABBIT_HOST'),
            port: process.env.RABBIT_PORT ? parseInt(process.env.RABBIT_PORT) : 5672,
            vhost: getStringValueOrThrow(process.env, 'RABBIT_VHOST'),
            user: getStringValueOrThrow(process.env, 'RABBIT_USER'),
            password: getStringValueOrThrow(process.env, 'RABBIT_PASS'),
        },
        SWAGGER_API_SPEC: getStringValueOrThrow(process.env, 'SWAGGER_API_SPEC'),
        DATA_COLLECTION_CRON: process.env.DATA_COLLECTION_CRON || '* * * * *',
        API_PREFIX: process.env.API_PREFIX || '/api',
        SESSION_COOKIE_TTL: process.env.SESSION_COOKIE_TTL ? parseInt(process.env.SESSION_COOKIE_TTL) : 1000 * 60 * 60 * 24,
        GOOGLE_APP_CLIENT_ID: getStringValueOrThrow(process.env, 'GOOGLE_APP_CLIENT_ID'),
        GOOGLE_APP_CLIENT_SECRET: getStringValueOrThrow(process.env, 'GOOGLE_APP_CLIENT_SECRET'),
        JIRA_PARAMS: {
            url: getStringValueOrThrow(process.env, 'JIRA_URL'),
            user: getStringValueOrThrow(process.env, 'JIRA_USER'),
            apiToken: getStringValueOrThrow(process.env, 'JIRA_API_TOKEN')
        }
    };
}
