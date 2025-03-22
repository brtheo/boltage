import {wire, track} from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import {
  trace,
  deepenedObject,
  createFieldsByObjectApiName,
  sanitizeApiNameCamelCase,
  boolPropsReducer
} from '../utils/_';

const MXN_NAME = 'useRecordsFields';


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
export const useRecordsFields = ({fields}) => clazz => {
  const fieldsByObjectApiName = createFieldsByObjectApiName(fields);
  const objectApiNames = Object.keys(fieldsByObjectApiName);
  // const recordIds = Object.fromEntries(
  //   objectApiNames.map(name => [name, `${sanitizeApiNameCamelCase(name)}Id`])
  // );
  const _clazz = class extends clazz {
    @track __RECORDS_FIELDS_MXN_VALUES__ = {};
    @track __RECORDS_FIELDS_MXN_INDEX_QUEUED__ = Array.from(Object.keys(objectApiNames), (_,i) => i);
    // @track __RECORDS_FIELDS_MXN_OBJECT_API_NAME_QUEUE__ = [...objectApiNames];
    @wire(getRecord, {
      recordId: '$CURRENT_ITEM_IN_ID_QUEUE',
      fields: '$CURRENT_ITEM_IN_FIELDS_QUEUE'
    })
    __RECORDS_FIELDS_MXN_WIRED_RESULTS__({data, error}) {
      const currentIndex = this.CURRENT_INDEX_IN_QUEUE;
      const objectApiName = objectApiNames[currentIndex];
      // const objectApiName = this.CURRENT_ITEM_IN_OBJECT_API_NAME_QUEUE;
      if(data && this.__RECORDS_FIELDS_MXN_VALUES__[objectApiName] === undefined) {
        this.__RECORDS_FIELDS_MXN_VALUES__[objectApiName] = Object.assign(
          {'Id': data?.id},
          deepenedObject(
            Object.fromEntries(
              fields[currentIndex].map(
                field => [field.fieldApiName, getFieldValue(data, field)]
              )
            )
          )
        );
        this.__RECORDS_FIELDS_MXN_INDEX_QUEUED__.shift();
      }
      if(error) trace(`${MXN_NAME}::getRecords`,error)
    };

    get CURRENT_INDEX_IN_QUEUE() {
      return this.__RECORDS_FIELDS_MXN_INDEX_QUEUED__?.at(0);
    }
    get CURRENT_ITEM_IN_FIELDS_QUEUE() {
      return fields[this.CURRENT_INDEX_IN_QUEUE];
    }
    get CURRENT_ITEM_IN_ID_QUEUE() {
      return this.recordIds[this.CURRENT_INDEX_IN_QUEUE];
    }
    get __RECORDS_FIELDS_MXN_DONE__() {
      return objectApiNames.reduce(...boolPropsReducer(this));
    }
  }
  objectApiNames.forEach(name => {
    Object.defineProperty(_clazz.prototype, name, {
      get() {return this.__RECORDS_FIELDS_MXN_VALUES__[name]; },
      set(value) { this.__RECORDS_FIELDS_MXN_VALUES__[name] = value; }
    });
  });

  return _clazz;
}