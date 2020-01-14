import DomainEvent from "./DomainEvent";

type FunctionalAggregate = {
    id: string,
    someProperty: string,
    someValueObjectProperty: {
        nestedObjectProperty: Date
    }
    someEntityProperty : {
        id: string
        nestedProperty: number
    }
}

function onSomeEvent(state: FunctionalAggregate, event: DomainEvent): FunctionalAggregate {
    // see: https://medium.com/javascript-in-plain-english/how-to-deep-copy-objects-and-arrays-in-javascript-7c911359b089
    const clone = require('rfdc')(); // really fast deep copy library
    let newState = clone(state);
    // change state using event
    return newState;
}

// this would be a typical event sourced functional aggregate method that executes a command
// it receives past events rebuilds current state using onSomeEvent functions
// uses a domain service if necessary
// and returns generated domain events
function updateProject(pastEvents:DomainEvent[], commandArguments: any[], domainService: any): DomainEvent[] {
    let generatedEvents = new Array<DomainEvent>();
  // reconstruct aggregate state from pastEvents, execute command, maybe using a damian service and return newly generated events
    return generatedEvents;
}
