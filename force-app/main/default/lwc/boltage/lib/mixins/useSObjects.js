import { getObjectInfos, getPicklistValuesByRecordType } from "lightning/uiObjectInfoApi";
import { wire, track } from 'lwc';
import { trace, sanitizeApiName, createFieldsByObjectApiName, boolPropsReducer } from '../utils/_';

const MXN_NAME = 'useSObjects';
/**
 * @param {Constructor<any>} genericConstructor
 * @param {Field[][]} fieldsArray
 * @returns
 */
export const useSObjects = ({fields}) => clazz =>{
  const fieldsByObjectApiName = createFieldsByObjectApiName(fields);
  const objectApiNames = Object.keys(fieldsByObjectApiName);
  const objectRefNames = Object.fromEntries(
    objectApiNames.map(name => [name, `${sanitizeApiName(name)}ref`])
  );
  const objectInfoNames = Object.fromEntries(
    objectApiNames.map(name => [name, `${sanitizeApiName(name)}info`])
  );
  const _clazz = class extends clazz {

    @track __SOBJECTS_MXN_INFO_RESULTS__ = {};
    @track __SOBJECTS_MXN_REFS__ = {};
    @track __SOBJECTS_MXN_RTYPE_IDS__ = {};
    @track __SOBJECTS_MXN_PICKLIST_FIELDS_FROM_INFO__ = Object.fromEntries(objectApiNames.map(name => [name, []]));
    @track __SOBJECTS_MXN_GET_PICKVAL_RESULTS__ = {};
    @track __SOBJECTS_MXN_GET_PICKVAL_QUEUE__ = [...objectApiNames];

    get CURRENT_ITEM_IN_PICKLIST_QUEUE() {return this.__SOBJECTS_MXN_GET_PICKVAL_QUEUE__?.at(0);}
    get CURRENT_RTID_IN_PICKLIST_QUEUE() {return this.__SOBJECTS_MXN_RTYPE_IDS__[this.CURRENT_ITEM_IN_PICKLIST_QUEUE];}
    get __SOBJECTS_MXN_DONE__() { return Object.values(objectInfoNames).reduce(...boolPropsReducer(this)); }

    @wire(getObjectInfos, {objectApiNames})
    __SOBJECTS_MXN_INFOS_WIRED__({data, error}) {
      if(data) {
        /** @type {InfoResult[]} */
        const results = data.results
          .filter(_ => _.statusCode === 200)
          .map(({result: {fields, defaultRecordTypeId, apiName}}) => {
            this.__SOBJECTS_MXN_RTYPE_IDS__[apiName] = defaultRecordTypeId;
            return Object({fields, defaultRecordTypeId, apiName})
          });

        /** Make a filtered object containing only the fields passed as arguments */
        this.__SOBJECTS_MXN_INFO_RESULTS__ = Object.fromEntries(
          results.map(({fields, apiName}) => [
            apiName,
            Object.fromEntries(
              Object.keys(fields)
                .filter(fieldApiName => fieldsByObjectApiName?.[apiName].map(field => field.fieldApiName).includes(fieldApiName))
                .map(fieldApiName => {
              /**
               * Keeping track of the picklist type fields
               * Useful for the getPicklistValuesByRecordType wire method
               */
              if(fields[fieldApiName].dataType === 'Picklist')
                this.__SOBJECTS_MXN_PICKLIST_FIELDS_FROM_INFO__[apiName].push(fieldApiName);
              return [fieldApiName, fields[fieldApiName]]
            }))
          ]
        ))
      }
      if(error) trace(`${MXN_NAME}::getObjectInfos`, error)
    }

    @wire(getPicklistValuesByRecordType, {
      objectApiName: '$CURRENT_ITEM_IN_PICKLIST_QUEUE',
      recordTypeId: '$CURRENT_RTID_IN_PICKLIST_QUEUE'
    })
    __SOBJECTS_MXN_PICKLIST_WIRED__({data, error}) {
      const objectApiName = this.CURRENT_ITEM_IN_PICKLIST_QUEUE;
      if(data && this.__SOBJECTS_MXN_GET_PICKVAL_RESULTS__[objectApiName] === undefined) {

        this.__SOBJECTS_MXN_GET_PICKVAL_RESULTS__[objectApiName] = (Object.keys(data.picklistFieldValues).length !== this.__SOBJECTS_MXN_PICKLIST_FIELDS_FROM_INFO__[objectApiName].length)
          ? Object.fromEntries(Object.keys(data.picklistFieldValues)
            .filter(apiName => this.__SOBJECTS_MXN_PICKLIST_FIELDS_FROM_INFO__[objectApiName].includes(apiName))
            .map(apiName => [apiName, data.picklistFieldValues[apiName]] )
          ) : data.picklistFieldValues;

        this.__SOBJECTS_MXN_PICKLIST_FIELDS_FROM_INFO__[objectApiName].forEach(field => {
          const {
            defaultValue,
            controllerValue,
            values } = this.__SOBJECTS_MXN_GET_PICKVAL_RESULTS__[objectApiName][field];
          this.__SOBJECTS_MXN_INFO_RESULTS__[objectApiName][field] = {
            ...this.__SOBJECTS_MXN_INFO_RESULTS__[objectApiName][field],
            defaultValue,
            controllerValue,
            values: values.map(({value, label}) => new Object({ value, label}))
          }
        });

        this.__SOBJECTS_MXN_GET_PICKVAL_QUEUE__.shift();

      }
      if(error) trace(`${MXN_NAME}::getPicklistValuesByRecordType`,error)
    }
  }
  objectApiNames.forEach(name => {
    Object.defineProperty(_clazz.prototype, objectRefNames[name], {
      get() {
        return this.__SOBJECTS_MXN_REFS__?.[name] ??
          Object.fromEntries(fieldsByObjectApiName[name]
            .map(field => [field.fieldApiName,'']))
      },
      set(value) { this.__SOBJECTS_MXN_REFS__[name] = value; }
    });

    Object.defineProperty(_clazz.prototype, objectInfoNames[name], {
      get() {
        return this.__SOBJECTS_MXN_GET_PICKVAL_RESULTS__[name] ? this.__SOBJECTS_MXN_INFO_RESULTS__[name] : undefined;
      }
    })
  })
  return _clazz;
}