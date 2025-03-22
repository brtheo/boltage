import {
  useSObject,
  useSObjects,
  usePoller,
  useExternalStyles,
  useRecordFields,
  useRecordsFields,
  useRelatedRecords
} from "./boltage";
import soqlQuery from '@salesforce/apex/Bolt.soqlQuery';
import soqlQueryWithoutCache from "@salesforce/apex/Bolt.soqlQueryWithoutCache";
import soqlQueryWithoutSharing from "@salesforce/apex/Bolt.soqlQueryWithoutSharing";
/**
 * Useful method to pass as an input a custom label formated as an ES6 template literal
 * like this : Hello ${name}
 * Take an object of the shape as a second parameter : {name: 'John Doe'}
 * @param {string} input
 * @param {Object} params
 * @returns {string}
 */
export const _interpolate = (input, params) => {
  const names = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...names, `return \`${input}\`;`)(...vals);
}
export const _interpolateFrom = (input, target) =>
  interpolate(input, pick(
    ...Array.from(input.matchAll(/\${(.*?)}/g), ([,v]) => v)
  ).from(target))

export const interpolate = (input, params = undefined) =>
  params === undefined
    ? {withValuesFrom: (obj) => _interpolateFrom(input, obj)}
    : _interpolate(input, params)
/**
 * Will plug your styles to an html element that has the attribute [data-style] on it
 * @param {string} styles
 */
export function setExternalStyles(styles) {
  this.refs?.style.insertAdjacentHTML('beforeend',`<style>${styles}</style>`)
}
export const css = (styles, ...args) => styles.reduce((_styles, curr, i) => `${_styles}${curr}${args?.[i] ?? ''}`,'');

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

export function trace(name, obj) {
  console.error(name, JSON.parse(JSON.stringify(obj)))
}

/**
 *
 * @param  {any[]} fns
 * @template T
 * @returns {Constructor<T>}
 */
export function mix(...fns) {
  const base = fns.pop();
  return fns.reduceRight( (comp, [mixin,...arg]) => class extends mixin(comp, ...arg){}, base);
}
export const compose = mix;


export const isCustomObject = (objectApiName) => {
  console.log(objectApiName, 'we are deep')
  return objectApiName.endsWith('__c');
}
export const trimCustomIdentifier = (objectApiName, until = -1) => objectApiName.slice(0,until);
export const sanitizeApiName = (objectApiName) =>
  isCustomObject(objectApiName)
    ? trimCustomIdentifier(objectApiName)
    : `${objectApiName}__`;
export const sanitizeApiNameCamelCase = (objectApiName) =>
  isCustomObject(objectApiName)
    ? trimCustomIdentifier(objectApiName, -3)
    : `${objectApiName}`;

export const deepMerge = (array) => {
  return array.reduce((result, current) => {
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
};
export const deepenedObject = (obj) =>
  deepMerge(
    Object.entries(obj)
    .map(([k,v]) =>
      k.split('.').reduceRight((prev,curr) =>
        Object.fromEntries([[curr,prev]]),v
      )
    )
  )
/**
 *
 * @param {Field[][]} arr
 * @returns {Record<string, Field[]>}
 */
export const createFieldsByObjectApiName = arr =>  arr.reduce((acc, curr) => Object.assign(acc, Object.fromEntries([[curr[0].objectApiName, curr]])),{})

export function getStack(args) {
  const stack = [];
  if(args?.recordFields) stack.push([useRecordFields, args.recordFields]);
  if(args?.recordsFields) stack.push([useRecordsFields, args.recordsFields]);
  if(args?.SObject) stack.push([useSObject, args.SObject]);
  if(args?.SObjects) stack.push([useSObjects, args.SObjects]);
  if(args?.relatedRecords) stack.push([useRelatedRecords, args.relatedRecords]);
  if(args?.externalStyles) stack.push([useExternalStyles, args.externalStyles]);
  if(args?.poller) stack.push([usePoller, args.poller]);
  return stack;
}

export const isOfMultipleSObject = fields => fields?.[0] instanceof Array;

export const boolPropsReducer = self => [
  (acc, prop) => acc && self[prop],
  true
]

export const allMxnDone = (self, maybeSuspendedMixins) =>
  maybeSuspendedMixins
    .filter(mxnProp => mxnProp in self)
    .reduce(...boolPropsReducer(self))


const USER_MODE = 'WITH USER_MODE';
const UNCACHED = 'UNCACHED';
const WITHOUT_SHARING = 'WITHOUT_SHARING';
const ARRAY_TOKEN = '$ARRAY$'
/**
  * @param {string[]} req
  * @param {any[]} args
*/
export const soql = async (req, ...args ) => {
  /** @type {{[key:string]:any}} */
   const params = {};
   let query = req.reduce((acc, curr, i) => {
    if(args[i] !== undefined) {
      const argName = `arg${i}`;
      const _curr = curr.toLowerCase()
      switch(true) {
        case typeof args[i] === 'function':
          return `${acc}${curr}${args[i]()}`
        case _curr.includes('in') && args[i] instanceof Array:
          params[argName] = ARRAY_TOKEN + JSON.stringify(args[i].reduce((obj, curr) => ({...obj, [curr]:''}), {}));
          return `${acc}${curr}:${argName}`;
        case _curr.includes('where'):
        case _curr.includes('and'):
        case _curr.includes('offset'):
        case _curr.includes('limit'):
        case _curr.includes('like'):
          params[argName] = args[i]
          return `${acc}${curr}:${argName}`;
        case _curr.includes('select') && args[i] instanceof Array:
          return `${acc}${curr}${args[i].join(',')}`;
        case _curr.includes('from'):
        case _curr.includes('select'):
          return `${acc}${curr}${args[i]}`;
        default: return '';
      }
    } else if(args.length === 0) return curr
    else return `${acc}${curr}`;
   }, '')
   let mode = USER_MODE;
   if(query.includes(USER_MODE))
    query = query.replace(USER_MODE, '');
   else mode = null;
   if(query.includes(UNCACHED)){
    query = query.replace(UNCACHED, '');
    return soqlQueryWithoutCache({query, params: JSON.stringify(params), mode});
   }
   else if(query.includes(WITHOUT_SHARING)){
    query = query.replace(WITHOUT_SHARING, '');
    return soqlQueryWithoutSharing({query, params: JSON.stringify(params), mode});
   }
  return soqlQuery({query, params: JSON.stringify(params), mode});
}
export const db = soql;