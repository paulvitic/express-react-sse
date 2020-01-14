import AggregateRoot from "../AggregateRoot";
import Role from "./Role";

export default class TeamMember extends AggregateRoot {
    roles: Role[];
}
