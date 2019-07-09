import { Entity } from './entity';
import _ from 'lodash';
// tslint:disable-next-line: no-duplicate-imports
import { Dictionary } from 'lodash';

export type EntityClass<T extends object> = new (object: T, options: any) => Entity<T>;

export default class EntityRegistry {
  defaultOptions: object;
  entityOptions: Dictionary<object> = {};

  // We hold the entities dictionary and the names separately to be able to prioritize by register order
  entities: Dictionary<EntityClass<any>> = {};
  entityNames: string[] = [];

  constructor(defaultOptions: any = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * Registers the given entity to be available through the from function
   * @param name the name of the entity
   * @param entityClass the constructor class for this entity
   * @param entityOptions the specific options for this entity
   */
  public registerEntity<T extends object>(
    name: string,
    entityClass: EntityClass<T>,
    entityOptions: Dictionary<object> = {}
  ): void {
    this.entities[name] = entityClass;
    this.entityOptions[name] = entityOptions;
    this.entityNames.push(name);
  }

  /**
   * Builds the specific options for the given entity from the default, entity specific and instance specific options
   * @param entityName
   * @param specificOptions
   */
  private buildOptions(entityName: string, specificOptions: any): any {
    let entityOptions = this.defaultOptions;

    if (this.entityOptions[entityName]) {
      entityOptions = _.merge(entityOptions, this.entityOptions[entityName]);
    }

    return _.merge(entityOptions, specificOptions);
  }

  /**
   * Whether the entity with the given name represents the given object
   * Default behaviour: object's properties need to match exactly all the properties within the getProperties function
   *
   * @param entityName
   * @param object
   * @param specificOptions
   */
  public isEntity(entityName: string, object: object, specificOptions: any = {}): boolean {
    const entityOptions = this.buildOptions(entityName, specificOptions);

    const entity = new this.entities[entityName](object, entityOptions);

    const properties = entity.getProperties();
    let unseenProperties = properties.length;

    for (const key in object) {
      if (!properties.includes(key)) {
        return false;
      }
      unseenProperties--;
    }
    return unseenProperties === 0;
  }

  /**
   * Finds which entity is appropiate for the given object and returns
   * a new instance of that entity
   * @param object the schema object to derive the entity from
   * @returns a new entity for the given object
   * @throws error if no entity was found
   */
  public from<T extends object, E extends Entity<T>>(object: T, specificOptions: any = {}): E {
    const entityName = this.entityNames
      .reverse()
      .find(entityName => this.isEntity(entityName, object, specificOptions));

    if (!entityName) {
      throw new Error('No entity was found for the given object');
    }

    const entityOptions = this.buildOptions(entityName, specificOptions);

    return new this.entities[entityName](object, entityOptions) as E;
  }
}
