import LogFactory from "../../app/LogFactory";

let id = 0;
interface Example {
  id: number,
  name: string
}

const examples: Example[] = [
    { id: id++, name: 'example 0' }, 
    { id: id++, name: 'example 1' }
];

export class ExamplesService {
  private readonly log = LogFactory.get(ExamplesService.name);
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

export default new ExamplesService();
