import _untilTemplate from '../untilTemplate.html';
import { allMxnDone } from '../utils/_';
const maybeSuspendedMixins = [
  '__SOBJECTS_MXN_DONE__',
  '__SOBJECT_MXN_DONE__',
  '__RECORDS_FIELDS_MXN_DONE__',
  '__RECORD_FIELDS_MXN_DONE__',
  '__RELATED_RECORDS_MXN_DONE__',
  '__FORM_MXN_DONE__',
  '__LIST_MXN_DONE__',
];

/**
 * Gives access to `<AnyObject>__c` property.
 * It's a map of the fields api name to their values. Can be edited and saved by passing the object to the `saveRecord` method provided by the mixin `useDML`
 * @example <caption>Basic Usage</caption>
 * import {useRecordFields} from 'c/bolt';
 *
 * import AnnualRevenue from '@salesforce/schema/Account.AnnualRevenue';
 * import CreatedDate from '@salesforce/schema/Account.CreatedDate';
 * import SLAExpirationDate__c from '@salesforce/schema/Account.SLAExpirationDate__c';
 *
 * const fields = [AnnualRevenue, CreatedDate, SLAExpirationDate__c];
 *
 * export class myLwc extends useRecordFields(LightningElement, fields) {
 *  ㅤ@api recordId;
 *
 *    doSomething() {
 *       console.log(this.Account.AnnualRevenue, this.Account.SLAExpirationDate__c);
 *    }
 * }
 */
/**
 * @typedef {Object} SuspenseParams
 * @param {Function} template
 * @param {Function} [untilTemplate]
 * @param {Function} done
 */
/**
 * @param {Constructor<any>} genericConstructor
 * @param {SuspenseParams} params
 * @returns {Constructor<any>}
 */
export const useSuspense = args => clazz =>
  class extends clazz {
    #INITIATED = false;
    get __SUSPENSE_MXN_ALL_SETTLED__() {
      const _allMxnDone = allMxnDone(this, maybeSuspendedMixins)
      return (args?.done?.(this) ?? true ) && _allMxnDone;
    }
    render() {
      return this.__SUSPENSE_MXN_ALL_SETTLED__
        ? args?.template ?? args.renderedTemplate(this)
        : args?.untilTemplate ?? _untilTemplate;
    }
    renderedCallback() {
      if(this.__SUSPENSE_MXN_ALL_SETTLED__ && !this.#INITIATED) {
        this.template.dispatchEvent(new CustomEvent('all-settled'));
        this.#INITIATED = true;
      }
    }
  }