/**
 * @typedef {Object} Field
 * @prop {String} fieldApiName
 * @prop {String} objectApiName
 */
/**
 * @typedef {Object} InfoField
 * @prop {string} apiName
 * @prop {string} dataType
 * @prop {string} label
 */
/**
 * @typedef {Object} InfoResult
 * @prop {string} defaultRecordTypeId
 * @prop {InfoField[]} fields
 * @prop {string} apiName
 */

/**
 * @typedef {new (...args: any[]) => T} Constructor<T>
 * @template T
 */

/**
 * @typedef {Object} DataTypeToInputType
 * @prop {'text'} [String]
 * @prop {'number'} [Double]
 * @prop {'toggle' | 'checkbox' | 'checkbox-button'} [Boolean]
 * @prop {'url'} [Url]
 * @prop {'email'} [Email]
 * @prop {'number'} [Currency]
 * @prop {'picklist'} [Picklist]
 * @prop {'tel'} [Phone]
 * @prop {'date'} [Date]
 * @prop {'datetime'} [DateTime]
*/

/**
 * @typedef {Object.<string, any>} SObject
 */
/**
 * @typedef {String} RecordId
 */

/**
 * @typedef {Object} Combobox
 * @prop {string | Array<string>} value
 * @prop {string | Array<string>} label
 * @prop {string | Array<string>} [description]
 */

/**
 * @typedef {'edit' | 'insert'} FormMode
 */