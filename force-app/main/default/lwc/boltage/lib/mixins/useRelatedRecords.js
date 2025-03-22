import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import {  wire } from 'lwc';
import { trace } from '../utils/_';
const MXN_NAME = 'useRelatedRecords';
const STANDARD_OBJ = {
  "Account": 1,
  "Contact": 2,
  "Lead": 3,
  "Opportunity": 4,
  "Case": 5,
  "Task": 6,
  "Event": 7,
  "Campaign": 8,
  "User": 9,
  "Quote": 10,
  "CampaignMember": 11,
  "Contract": 12,
};
/**
 * Binds together an input to a class property
 * @example <caption>Basic Usage</caption>
 * // js
 * import {useRelatedRecords} from 'c/bolt';
 * export class myLwc extends useRelatedRecords(LightningElement, 'RelatedObjects__r', ['RelatedObject__c.Field__c']) {
 *  ㅤ@api recordId;
 *    doSomething() {
 *         console.log(this.RelatedObjects__r.Field__c); // <== access the queried field
 *    }
 * }
 */
/**
 * @param {Constructor<any>} genericConstructor
 * @returns {Constructor<any>}
 */
export const useRelatedRecords = ({
  relatedListId,
  fields,
  where,
  sortBy,
  pageSize,
  optionalFields
}) => clazz => {
  const isArrayOfStrings = typeof fields.at(0) === 'string';
  const _fields = [];
  const fieldsApiName = isArrayOfStrings
    ? fields.map(field => field.split('.').toSpliced(0,1).join('.'))
    : fields.map(({fieldApiName, objectApiName}) => {
      _fields.push(`${objectApiName}.${fieldApiName}`)
      return fieldApiName
    });
  const _clazz = class extends clazz {

    @wire(getRelatedListRecords, {
      parentRecordId: '$parentRecordId',
      relatedListId,
      fields: isArrayOfStrings ? fields : _fields,
      sortBy,
      pageSize,
      where,
      optionalFields
    })
    __RELATED_RECORDS_MXN_WIRED_RESULTS__;

    get __RELATED_RECORDS_MXN_DONE__() { return this[relatedListId] instanceof Array && this[relatedListId] != undefined; }
  }
  Object.defineProperty(_clazz.prototype, relatedListId, {
    get() {
      if(this?.__RELATED_RECORDS_MXN_WIRED_RESULTS__?.error)
        trace(`${MXN_NAME}::getRelatedListRecords`,this.__RELATED_RECORDS_MXN_WIRED_RESULTS__.error)
      else {
        return this?.__RELATED_RECORDS_MXN_WIRED_RESULTS__.data?.records.map(record =>
          Object.fromEntries(
            fieldsApiName.map(field => {
              const fieldPath = field.split('.').at(0);
              const [related, fieldValue] = (['r','s'].includes(fieldPath.at(-1)) || STANDARD_OBJ.hasOwnProperty(fieldPath))
                ? field.split('.')
                : [field, ''];
              const fieldApiName = record.fields?.[related]
              return [
                related, (['r','s'].includes(fieldPath.at(-1)) || STANDARD_OBJ.hasOwnProperty(fieldPath) )
                  ? Object.fromEntries([[fieldValue, fieldApiName?.value?.fields?.[fieldValue]?.value]])
                  : fieldApiName?.value
                ]
            })
          )
        )
      }
      return undefined;
    }
  });
  return _clazz;
}