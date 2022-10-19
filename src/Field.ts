import { AnyContract, ContractName } from './Container.js';
import { InvalidTargetError } from './error/InvalidTargetError.js';
import { MissingValueError } from './error/MissingValueError.js';
import { doesExist, isNil } from './utils/index.js';

export interface Binding {
  key: string;
  name: ContractName;
}

export const fieldSymbol = Symbol('noicejs-field');

/**
 * Get attached dependencies.
 *
 * @param target - the previously-decorated target
 *
 * @public
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function getFields(target: any): Array<Binding> {
  if (Reflect.has(target, fieldSymbol)) {
    const existing = Reflect.get(target, fieldSymbol);
    console.log('target has fields', target, existing);
    if (Array.isArray(existing)) {
      return existing;
    }
  } else {
    // first dep for this target, check prototype
    const proto = Reflect.getPrototypeOf(target);
    console.log('target does not have fields, checking prototype', target, proto);
    if (doesExist(proto) && proto !== target) {
      return getFields(proto);
    }
  }

  console.log('making new fields for target', target);
  return [];
}

/**
 * Injection decorator for classes.
 *
 * @param needs - dependencies required by the decorated target
 *
 * @public
 */
export function Field(gets: ContractName) {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return (target: any, key?: string, _providedDesc?: PropertyDescriptor) => {
    if (isNil(key)) {
      throw new InvalidTargetError('field decorator must be used on a field');
    } else {
      const fields = getFields(target);
      const prev = fields.find((it) => it.name === key);

      console.log('binding field', target, key, gets);
      if (doesExist(prev)) {
        prev.name = gets;
      } else {
        fields.push({
          key,
          name: gets,
        });
      }

      Reflect.set(target, fieldSymbol, fields);
    }
  };
}

export function fillFields(target: object, values: Record<ContractName, AnyContract>): void {
  const proto = Reflect.getPrototypeOf(target);
  const fields = getFields(proto);

  console.log('filling fields on target', fields.length, fields, target);
  for (const field of fields) {
    if (Reflect.has(values, field.name)) {
      Reflect.set(target, field.key, values[field.name]);
    } else {
      throw new MissingValueError('missing value for field');
    }
  }
}
