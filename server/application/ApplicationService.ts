import EventBus from "../domain/EventBus";
import AggregateRoot from "../domain/AggregateRoot";
import {Repository} from "../domain/Repository";

export default abstract class ApplicationService<T> {
    protected constructor(
        private readonly eventBus: EventBus,
        private readonly repository: Repository<T>
    ) {}

    publishEventsOf = async (aggregate: AggregateRoot): Promise<void> => {
        aggregate.publishEventsUsing(this.eventBus.publish);
    };
}
