import EventBus from "../domain/EventBus";
import {AggregateRoot} from "../domain/AggregateRoot";

export default abstract class ApplicationService {
    protected constructor(private readonly eventBus: EventBus) {}

    publishEventsOf = async (aggregate: AggregateRoot): Promise<void> => {
        aggregate.publishEventsUsing(this.eventBus.publish);
    };
}
