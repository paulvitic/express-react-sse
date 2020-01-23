SET ROLE TO 'jira';

CREATE TABLE jira.event_log
(
    aggregate_id VARCHAR(31) NOT NULL,
    aggregate    VARCHAR(31) NOT NULL,
    sequence     INT         NOT NULL,
    generated_on TIMESTAMP   NOT NULL,
    event_type   VARCHAR(31) NOT NULL,
    event        json        NOT NULL
);

CREATE INDEX event_log_idx ON jira.event_log (aggregate, aggregate_id, sequence);

CREATE TABLE jira.ticket_board
(
    id           VARCHAR(31) PRIMARY KEY,
    external_id  INT         NOT NULL,
    external_key VARCHAR(31) NOT NULL,
    constraint unique_external_ref unique (external_id, external_key)
);
