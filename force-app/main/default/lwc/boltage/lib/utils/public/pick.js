/**
 * @callback From
 * @param {Object} obj
 * @returns {Object}
 */
/**
 * @typedef {Object} PickReturns
 * @param {From} from
 */
/**
 * @param {Array<String>} fields
 * @returns {PickReturns}
 */
export function pick(...fields) {
  return {
    from: (obj) => fields.reduce((acc, field) =>
      Object.assign(acc, {[field]: obj[field]}) , {})
  }
}