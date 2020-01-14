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
