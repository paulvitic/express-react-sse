import AggregateRoot from "../AggregateRoot";

export class TeamMember extends AggregateRoot {

    teamMember: TeamMember;

    startAppSession = () => {
        // TODO implement when user logs-in with a device
    };

    endAppSession = () => {
        // TODO implement when user logs-out of application from a device
    };
}
