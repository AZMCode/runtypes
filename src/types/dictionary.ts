import { Runtype, create, Static } from '../runtype.ts';
import show from '../show.ts';

export interface StringDictionary<V extends Runtype> extends Runtype<{ [_: string]: Static<V> }> {
  tag: 'dictionary';
  key: 'string';
  value: V;
}

export interface NumberDictionary<V extends Runtype> extends Runtype<{ [_: number]: Static<V> }> {
  tag: 'dictionary';
  key: 'number';
  value: V;
}

/**
 * Construct a runtype for arbitrary dictionaries.
 */
export function Dictionary<V extends Runtype>(value: V, key?: 'string'): StringDictionary<V>;
export function Dictionary<V extends Runtype>(value: V, key?: 'number'): NumberDictionary<V>;
export function Dictionary<V extends Runtype>(value: V, key = 'string'): any {
  return create<Runtype>(
    x => {
      if (x === null || x === undefined) {
        const a = create<any>(x as never, { tag: 'dictionary', key, value });
        return { success: false, message: `Expected ${show(a)}, but was ${x}` };
      }

      if (typeof x !== 'object') {
        const a = create<any>(x as never, { tag: 'dictionary', key, value });
        return { success: false, message: `Expected ${show(a.reflect)}, but was ${typeof x}` };
      }

      if (Object.getPrototypeOf(x) !== Object.prototype) {
        if (!Array.isArray(x)) {
          const a = create<any>(x as never, { tag: 'dictionary', key, value });
          return {
            success: false,
            message: `Expected ${show(a.reflect)}, but was ${Object.getPrototypeOf(x)}`,
          };
        } else if (key === 'string')
          return { success: false, message: 'Expected dictionary, but was array' };
      }

      for (const k in x) {
        // Object keys are unknown strings
        if (key === 'number') {
          if (isNaN(+k))
            return {
              success: false,
              message: 'Expected dictionary key to be a number, but was string',
            };
        }

        let validated = value.validate((x as any)[k]);
        if (!validated.success) {
          return {
            success: false,
            //@ts-ignore -- deno
            message: validated.message,
            //@ts-ignore -- deno
            key: validated.key ? `${k}.${validated.key}` : k,
          };
        } else if (validated.value !== x[x]) {
          x[k] = validated.value;
        }
      }

      return { success: true, value: x };
    },
    { tag: 'dictionary', key, value },
  );
}
