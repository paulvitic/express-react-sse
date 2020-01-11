import EventBus from "../domain/EventBus";
import EventPublisher from "../domain/EventPublisher";
import {AggregateRoot} from "../domain/AggregateRoot";

export default abstract class ApplicationService implements EventPublisher {
    protected constructor(private readonly eventBus: EventBus) {}

    publishEventsOf = async (aggregate: AggregateRoot): Promise<void> => {
        aggregate.publishEventsUsing(this.eventBus.publish);
    };
}
