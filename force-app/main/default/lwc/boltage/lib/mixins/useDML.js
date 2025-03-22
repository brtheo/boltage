import { updateRecord, createRecord, deleteRecord} from 'lightning/uiRecordApi';
/**
 * @param {Constructor<any>} constructor
 * @returns {Constructor<any>}
 */
export const useDML = clazz =>
  class extends clazz {
    /**
     * @param {Array<RecordId>} ids
     */
    deleteRecords(ids) {
      return Promise.allSettled(ids.map(this.deleteRecord));
    }
    /**
     * @param {RecordId} id
     */
    deleteRecord(id) {
      return deleteRecord(id);
    }
    /**
     *
     * @param {SObject} record
     * @param {String} apiName
     * @returns {Promise<SObject>}
     */
    saveRecord(record, apiName) {
      return record.Id
        ? updateRecord( {fields: record} )
        : createRecord( {apiName, fields: record} )
    }
     /**
     *
     * @param {SObject[]} records
     * @param {String} apiName
     * @returns {Promise<SObject[]>}
     */
    saveRecords(records, apiName) {
      return Promise.allSettled(records.map(record => this.saveRecord(record, apiName)))
    }
  }