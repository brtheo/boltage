import {wire, track} from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { trace, deepenedObject } from '../utils/_';
const MXN_NAME = 'useRecordFields';
export const UsedObjectApiName = Symbol();

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
 * @param {Constructor<any>} genericConstructor
 * @returns {Constructor<any>}
 */
export const useRecordFields = ({fields, objectApiName}) => clazz => {
  const isDynamic = typeof fields === 'function';

  const _objectApiName = isDynamic
    ? objectApiName
    : fields[0].objectApiName;

  const _clazz = class extends clazz {
    @wire(getRecord, {recordId: '$recordId', fields: '$__RECORD_FIELDS_MXN_FIELDS__'})
    __RECORD_FIELDS_MXN_WIRED_RESULTS__;
    @track __RECORD_FIELDS_MXN_VALUE__;
    get __RECORD_FIELDS_MXN_DONE__() { return this[_objectApiName] !== undefined; }
    get __RECORD_FIELDS_MXN_FIELDS__() { return isDynamic ? fields(this) : fields; }
    [UsedObjectApiName] = _objectApiName
  }

  Object.defineProperty(_clazz.prototype, _objectApiName, {
    get() {
      if(this?.__RECORD_FIELDS_MXN_WIRED_RESULTS__?.error)
        trace(`${MXN_NAME}::getRecord`, this.__RECORD_FIELDS_MXN_WIRED_RESULTS__.error)
      else return this.__RECORD_FIELDS_MXN_VALUE__
        ?? Object.assign(
          {'Id': this?.__RECORD_FIELDS_MXN_WIRED_RESULTS__?.data?.id},
          deepenedObject(
            Object.fromEntries(
              this.__RECORD_FIELDS_MXN_FIELDS__.map(
                field => [
                  field.fieldApiName,
                  getFieldValue(this.__RECORD_FIELDS_MXN_WIRED_RESULTS__.data, field)
                ]
            )
           )
          )
        )
    },
    set(value) { this.__RECORD_FIELDS_MXN_VALUE__ = value; }
  });
  return _clazz;
}