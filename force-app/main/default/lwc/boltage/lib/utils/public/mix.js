/**
 *
 * @param  {[BaseClass, ...mixins]} mixins
 * @returns {Constructor<any>}
 */
export function mix(...mixins) {
  const [ base, ...mixs] = mixins;

  let composed = class extends base { constructor(...args){ super(...args); } };

  for (const mixin of mixs) {
    composed = mixin(composed);
  }

  return composed;
}