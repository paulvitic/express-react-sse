import AggregateRoot from "../AggregateRoot";

// Could be a Role Value object
class Permission extends AggregateRoot {
    effect: string;     // "Allow" or "Deny"
    resource: string;   // "arn:aws:logs:eu-central-1:729931820431:*", or aggregate and more specifically aggregate:id
    action: string;     // "logs:CreateLogGroup", or for each aggregate command handler method
}
