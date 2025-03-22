/**
 * @param {Array<any>} array
 * @returns {Record<string, string | number | boolean | null>}
 */
export const deepMerge = array =>
  array.reduce((result, current) => {
    const merge = (target, source) => {
      Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object') {
          target[key] = target[key] || {};
          merge(target[key], source[key]);
        } else if (source[key] !== undefined) {
          target[key] = source[key];
        }
      });
      return target;
    };
    return merge(result, current);
  }, {});
/**
 *
 * @param {Record<string, string | number | boolean | null>} obj
 * @returns {deepMerge}
 */
export const deepenedObject = obj =>
  deepMerge(
    Object.entries(obj)
    .map(([k,v]) =>
      k.split('.').reduceRight((prev,curr) =>
        Object.fromEntries([[curr,prev]]),v
      )
    )
  );