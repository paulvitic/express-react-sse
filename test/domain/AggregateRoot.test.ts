import AggregateRoot from "../../server/domain/AggregateRoot";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

class MockAggregate extends AggregateRoot{

    static create(): MockAggregate {
        let agg = new MockAggregate("id");
        agg.recordEvent({
            eventType: "MockEventType",
            sequence: 0,
            generatedOn: new Date(),
            aggregate: "MockAggregate",
            aggregateId: "id"});
        agg.recordEvent({
            eventType: "MockEventType",
            sequence: 0,
            generatedOn: new Date(),
            aggregate: "MockAggregate",
            aggregateId: "id"});
        return agg
    }
}

let mockAggregate = MockAggregate.create();

test('should not assert ticket board', async () => {
    let counter = 0;
    let mockEventPublisher = jest.fn().mockImplementation(() => {
        return TE.tryCatch(() => {
            counter++;
            return new Promise<E.Either<Error, boolean>>(resolve => {
                counter <= 1 ? resolve(E.right(true)): resolve(E.right(false))
            })
        }, reason => new Error(String(reason)))
    });

    let eventPublishTask = mockAggregate.publishEventsUsing(mockEventPublisher);
    let published = await eventPublishTask.run();
    expect(published.isRight()).toBe(true)
});
