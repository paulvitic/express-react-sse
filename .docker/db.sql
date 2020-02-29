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

CREATE TABLE jira.ticket_board
(
    id           VARCHAR(31) PRIMARY KEY,
    external_ref INT         NOT NULL,
    key          VARCHAR(31) NOT NULL,
    constraint unique_external_ref unique (external_ref, key)
);

CREATE TABLE jira.development_project
(
    id              VARCHAR(31) PRIMARY KEY,
    active          BOOLEAN     NOT NULL,
    name            VARCHAR(63) NOT NULL,
    started_on      TIMESTAMP   NOT NULL,
    ticket_Board_id VARCHAR(31),
    FOREIGN KEY (ticket_Board_id) REFERENCES ticket_board (id)
);

CREATE TABLE jira.ticket_update_collection
(
    id             VARCHAR(31) PRIMARY KEY,
    dev_project_id VARCHAR(31) NOT NULL,
    form_day       TIMESTAMP   NOT NULL,
    to_day         TIMESTAMP   NOT NULL,
    started_at     TIMESTAMP   NOT NULL,
    ended_at       TIMESTAMP,
    status         VARCHAR(31) NOT NULL,
    no_of_tickets  INT
);


