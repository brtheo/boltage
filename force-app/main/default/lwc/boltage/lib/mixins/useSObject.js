import { getObjectInfo, getPicklistValuesByRecordType } from "lightning/uiObjectInfoApi";
import { wire, track } from 'lwc';
import { trace, sanitizeApiName } from '../utils/_';
const MXN_NAME = 'useSObject';
export const INFO_REST = Symbol('INFO_REST');
/**
 * Provides two property on the class : {<SOBjectName>__ref, <SObjectName__info>}
 * <SOBjectName>__ref is useful if you want to build a form to create a record of that type as it gives you
 * an object initialized with all keys corresponding to what you've provided in the fields argument and each value initialized
 * as an empty string.
 * <SOBjectName>__info is useful to quickly access SObject related info such as fields label, picklist values, recordtype infos etc
 * @example <caption>Basic usage</caption>
 * // Javascript
 * import {LightningElement} from 'lwc';
 * import {useSObject, mix} from 'c/bolt';
 * const Composed = mix(
 *   [useSObject, fields],
 *   LightningElement
 * );
 * export class MyComponent extends Composed {...}
 * // HTML
 * <lightning-combobox
 *   data-bind="SomeObject__ref.somePicklist__c"
 *   value={SomeObject__ref.somePicklist__c}
 *   label={SomeObject__info.somePicklist__c.label}
 *   options={SomeObject__info.somePicklist__c.values}
 *   onchange={bind}>
 * </lightning-combobox>
 */
/**
 * @param {Constructor<any>} genericConstructor
 * @param {Field[]} _fields
 * @param {string} recordTypeId
 * @returns {Constructor<any>}
 */
export const useSObject = ({fields, recordTypeId, objectApiName}) => clazz => {
  const isDynamic = typeof fields === 'function';

  const _recordTypeId = recordTypeId === undefined
    ? 'default'
    : recordTypeId;

  const _objectApiName = isDynamic
    ? objectApiName
    : fields[0].objectApiName;

  const objectRefName = `${sanitizeApiName(_objectApiName)}ref`;
  const objectInfoName = `${sanitizeApiName(_objectApiName)}info`;

  const _clazz = class extends clazz {

    @track __SOBJECT_MXN_SOBJECT_REF__;
    @track __SOBJECT_MXN_RTYPE_ID__;

    get __SOBJECT_MXN_DONE__() { return this[objectInfoName] !== undefined;}
    get __SOBJECT_MXN_UNIQUE_FIELDS__() {
      return new Set(this.__SOBJECT_MXN_FIELDS__?.map(({fieldApiName}) => fieldApiName))
    }
    get __SOBJECT_MXN_FIELDS__() { return isDynamic ? fields(this) : fields; }

    @wire(getObjectInfo, {objectApiName: _objectApiName})
    __SOBJECT_MXN_INFO_WIRED__;

    @wire(getPicklistValuesByRecordType, {
      objectApiName: _objectApiName,
      recordTypeId: '$__SOBJECT_MXN_RTYPE_ID__'
    })
    __SOBJECT_MXN_PICKLIST_WIRED__;
  }

  Object.defineProperty(_clazz.prototype, objectRefName, {
    get() {
      return this.__SOBJECT_MXN_SOBJECT_REF__
        ?? Object.fromEntries(this.__SOBJECT_MXN_FIELDS__.map(field => [field.fieldApiName,null]));
    },
    set(value) { this.__SOBJECT_MXN_SOBJECT_REF__ = value; }
  });

  Object.defineProperty(_clazz.prototype, objectInfoName, {
    get() {
      if(this.__SOBJECT_MXN_INFO_WIRED__.data ) {
        this.__SOBJECT_MXN_RTYPE_ID__ = _recordTypeId === 'default'
          ? this.__SOBJECT_MXN_INFO_WIRED__.data.defaultRecordTypeId
          : _recordTypeId;
        if(this.__SOBJECT_MXN_PICKLIST_WIRED__.data) {

          const picklistFields = [];
          const {fields: wiredFields} = this.__SOBJECT_MXN_INFO_WIRED__.data;
          const filteredFields = Object.fromEntries(
            Object.keys(wiredFields)
            .filter(_fieldApiName =>
              this.__SOBJECT_MXN_UNIQUE_FIELDS__?.has(_fieldApiName)
            ).map(fieldApiName => {
              if(wiredFields[fieldApiName].dataType === 'Picklist')
                picklistFields.push(fieldApiName)
              return [fieldApiName, wiredFields[fieldApiName]];
            })
          );

          const {data: {picklistFieldValues}} = this.__SOBJECT_MXN_PICKLIST_WIRED__;
          Object.keys(filteredFields).forEach(field => {
            if(picklistFieldValues?.[field]) {
              const {
                defaultValue,
                controllerValue,
                values
              } = picklistFieldValues[field];
              filteredFields[field] = {
                ...filteredFields[field],
                defaultValue,
                controllerValue,
                values: values.map(({value, label}) => ({ value, label}))
              }
            }
          });
          return Object.assign(filteredFields, {
            defaultRecordTypeId: this.__SOBJECT_MXN_INFO_WIRED__.data.defaultRecordTypeId
          })
        }
      }
    }
  });
  return _clazz;
}