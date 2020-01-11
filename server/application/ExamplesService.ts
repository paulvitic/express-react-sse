import LogFactory from "../context/LogFactory";
import ApplicationService from "./ApplicationService";
import EventBus from "../domain/EventBus";

let id = 0;
interface Example {
  id: number,
  name: string
}

const examples: Example[] = [
    { id: id++, name: 'example 0' }, 
    { id: id++, name: 'example 1' }
];

export default class ExamplesService extends ApplicationService {
  private readonly log = LogFactory.get(ExamplesService.name);

  constructor (eventBus: EventBus){
    super(eventBus);
  }

  all(): Promise<Example[]> {
    this.log.info('fetch all examples');
    return Promise.resolve(examples);
  }

  byId(id: number): Promise<Example> {
    this.log.info(`fetch example with id ${id}`);
    return this.all().then(r => r[id])
  }

  create(name: string): Promise<Example> {
    this.log.info(`create example with name ${name}`);
    const example: Example = {
      id: id++,
      name
    };
    examples.push(example);
    return Promise.resolve(example);
  }
}
