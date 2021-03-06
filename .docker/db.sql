--ALTER DATABASE postgres SET timezone TO 'Europe/Berlin';
--SET ROLE TO 'jira';

CREATE TABLE jira.user_sessions
(
    sid    VARCHAR      COLLATE "default" NOT NULL,
    sess   json         NOT NULL,
    expire TIMESTAMP(6) NOT NULL
)
    WITH (OIDS= FALSE);

ALTER TABLE jira.user_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IDX_session_expire ON jira.user_sessions (expire);

CREATE TABLE jira.event_log
(
    aggregate_id VARCHAR(31) NOT NULL,
    aggregate    VARCHAR(31) NOT NULL,
    generated_on TIMESTAMP   NOT NULL,
    event_type   VARCHAR(31) NOT NULL,
    published    BOOLEAN     NOT NULL,
    event        json        NOT NULL
);

CREATE INDEX event_log_idx ON jira.event_log (aggregate, aggregate_id);

CREATE TABLE jira.product_development
(
    product_dev_id VARCHAR(31) PRIMARY KEY,
    active         BOOLEAN     NOT NULL,
    name           VARCHAR(63) NOT NULL,
    started_on     TIMESTAMP   NOT NULL
);

CREATE TABLE jira.ticket_board
(
    ticket_board_id  VARCHAR(31) PRIMARY KEY,
    ticket_board_ref INT         NOT NULL,
    ticket_board_key VARCHAR(31) NOT NULL,
    product_dev_fk   VARCHAR(31) NOT NULL,
    FOREIGN KEY (product_dev_fk) REFERENCES jira.product_development (product_dev_id),
    CONSTRAINT unique_ticket_board_ref unique (ticket_board_ref, ticket_board_key)
);

CREATE TABLE jira.ticket_update_collection
(
    collection_id    VARCHAR(31) PRIMARY KEY,
    active           BOOLEAN     NOT NULL,
    status           VARCHAR(31) NOT NULL,
    product_dev_fk   VARCHAR(31) NOT NULL,
    ticket_board_key VARCHAR(31) NOT NULL,
    from_day         DATE        NOT NULL,
    to_day           DATE        NOT NULL,
    started_at       TIMESTAMP,
    ended_at         TIMESTAMP,
    FOREIGN KEY (product_dev_fk) REFERENCES jira.product_development (product_dev_id)
);

CREATE INDEX ticket_update_collection_product_dev_fk_idx ON jira.ticket_update_collection (product_dev_fk, started_at DESC);

CREATE TABLE jira.ticket_update
(
    ticket_update_id VARCHAR(31) PRIMARY KEY,
    ticket_ref       INT         NOT NULL,
    ticket_key       VARCHAR(31) NOT NULL,
    collected        BOOLEAN     NOT NULL,
    collection_fk    VARCHAR(31) NOT NULL,
    FOREIGN KEY (collection_fk) REFERENCES jira.ticket_update_collection (collection_id),
    CONSTRAINT unique_ticket_update_ref UNIQUE (ticket_ref, ticket_key, collection_fk)
);

CREATE TABLE jira.ticket_history
(
    latest         BOOLEAN     NOT NULL,
    ticket_ref     INT         NOT NULL,
    ticket_key     VARCHAR(31) NOT NULL,
    issue_type     VARCHAR(31) NOT NULL,
    work_type      VARCHAR(31) NOT NULL,
    story_points   INT,
    status         VARCHAR(31),
    assignee       VARCHAR(31),
    sprint_count   INT,
    started_at     TIMESTAMP   NOT NULL,
    ended_at       TIMESTAMP,
    duration       BIGINT,
    product_dev_fk VARCHAR(31) NOT NULL,
    collection_fk  VARCHAR(31) NOT NULL,
    FOREIGN KEY (product_dev_fk) REFERENCES jira.product_development (product_dev_id),
    FOREIGN KEY (collection_fk) REFERENCES jira.ticket_update_collection (collection_id)
);

CREATE INDEX ticket_history_idx ON jira.ticket_history (ticket_ref, latest, started_at DESC);
