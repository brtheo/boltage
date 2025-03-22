const SELF_IDENTIFIER = '$';
/**
 * @example <caption>Basic Usage</caption>
 * import { comboboxify } from 'c/bolt';
 * export default class myLwc extends LightningElement {
 * ㅤ@track comboboxOptions
 * ㅤ@wire(apexMethod)
 *   wiredMethod({err,data}) {
 *     if(data) {
 * // use '$' symbol if the auraEnabled method is returning a list of primitives
 *        this.comboboxOptions = comboboxify(data, {label: '$', value: '$'});
 *    }
 * }
 * @example <caption>AuraEnabled method is returning a list of Objects</caption>
 *   wiredMethod({err,data}) {
 *     if(data)
 *        this.comboboxOptions = comboboxify(data, {
 *          label: ['Deeply__r.Nested__r.Object__c'],
 *          value: ['Deeply__r.Nested__r.Object__r.Value__c']
 *        });
 *    }
 * }
 * @example <caption>In case you want to concatenate multiple fields (will be joined by a 'space')</caption>
 *   wiredMethod({err,data}) {
 *     if(data)
 *        this.comboboxOptions = comboboxify(data, {
 *          label: ['FirstName', 'LastName'],
 *          value: ['Id']
 *        });
 *    }
 * }
 * @param {Array<SObject>} input 
 * @param {Combobox} param 
 * @returns {Array<Combobox>}
 */
export function comboboxify (input, {value, label, description}) {
    /**
   * @param {string} path
   * @param {SObject} obj
   * @returns {string}
   */
  const getValueFromStringPath = (path, obj) => path.split('.').reduce((accObj, curr) => accObj[curr], obj);

  /**
   * @param {Array<string>} input 
   * @param {SObject | string} value
   * @returns {string}
   */
  const templater = (input, value) => input.map(str => str === SELF_IDENTIFIER 
    ? value 
    : getValueFromStringPath(str, value)
  ).join(' ');

  /**
   * @param {string | Array<string>} key 
   * @param {SObject} sobject 
   * @returns {string}
   */
  const getValueForKey = (key, sobject) => key === SELF_IDENTIFIER ? sobject : templater(key,sobject);

  /**
   * @param {SObject} val 
   * @returns {Combobox}
   */
  const mappedObject = val => Object({
    label: getValueForKey(label, val),
    value: getValueForKey(value, val)
  });
  return input.map(val => description !== undefined 
    ? Object.assign(mappedObject(val), {description: getValueForKey(description, val)} ) 
    : mappedObject(val))
  }