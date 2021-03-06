/**
 * @file `generic-functions.ts`
 *   Created on March 12, 2017
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 */


/**
 * `move`
 *
 *   Moves items from one set to the other.
 */
export function move<T>(
    src: Set<T>,
    dst: Set<T>,
    items: T[],
    moveEffect: (v: T) => void
        = (v: T) => { }
) {
    items.forEach(v => {
        if (!dst.has(v)) {
            dst.add(v);
            src.delete(v);
            moveEffect(v);
        }
    });
}


/**
 * `filterSet`
 *
 *   Gets a collection of filtered items from a set.
 *
 * @see {@link https://github.com/Microsoft/TypeScript/issues/5236}
 */
export function filterSet<S, F extends S>(set: Set<S>, constructor: { new (...args: any[]): F }) {
    const items: F[] = [];
    set.forEach(v => {
        if (v instanceof constructor)
            items.push(v);
    });
    return items;
}
