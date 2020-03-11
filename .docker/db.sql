SET ROLE TO 'jira';

CREATE TABLE jira.event_log
(
    aggregate_id VARCHAR(31) NOT NULL,
    aggregate    VARCHAR(31) NOT NULL,
    generated_on TIMESTAMP   NOT NULL,
    event_type   VARCHAR(31) NOT NULL,
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
    FOREIGN KEY (product_dev_fk) REFERENCES product_development (product_dev_id),
    CONSTRAINT unique_ticket_board_ref unique (ticket_board_ref, ticket_board_key)
);

CREATE TABLE jira.ticket_update_collection
(
    collection_id    VARCHAR(31) PRIMARY KEY,
    active           BOOLEAN     NOT NULL,
    status           VARCHAR(31) NOT NULL,
    product_dev_fk   VARCHAR(31) NOT NULL,
    ticket_board_key VARCHAR(31) NOT NULL,
    from_day         TIMESTAMP   NOT NULL,
    to_day           TIMESTAMP   NOT NULL,
    started_at       TIMESTAMP,
    ended_at         TIMESTAMP,
    FOREIGN KEY (product_dev_fk) REFERENCES product_development (product_dev_id)
);

CREATE TABLE jira.ticket_update
(
    ticket_update_id VARCHAR(31) PRIMARY KEY,
    ticket_ref       INT         NOT NULL,
    ticket_key       VARCHAR(31) NOT NULL,
    collected        BOOLEAN     NOT NULL,
    collection_fk    VARCHAR(31) NOT NULL,
    FOREIGN KEY (collection_fk) REFERENCES ticket_update_collection (collection_id),
    CONSTRAINT unique_ticket_update_ref UNIQUE (ticket_ref, ticket_key)
);
