import { getListRecordsByName, getListInfoByName } from "lightning/uiListsApi";
import { getRecords } from 'lightning/uiRecordApi';
import { useSObject } from 'c/boltage';
import { sanitizeApiName } from "../utils/_";
import { wire, track } from 'lwc';

const dataTypeToColumnType = {
  Boolean: 'boolean',
  Currency: 'currency',
  Date: 'date',
  DateTime: 'date',
  Double: 'number',
  Email: 'email',
  Int: 'number',
  Location: 'location',
  Long: 'number',
  Percent: 'number',
  Url: 'url'
};

export const useListView = ({listViewApiName, objectApiName, recordsPerPage, optionalFields, sort}) => clazz => class extends useSObject({
  objectApiName,
  fields: self => self.ListViewFields !== undefined 
    ? self.ListViewFields?.concat(optionalFields ?? []) 
    : undefined
})(clazz) {
  @track pageToken = 0;
  @track _pageSize = recordsPerPage ?? 50;
  @track actualFirstRowId;
  @track currentFirstRowId;
  @track previousFirstRowId;
  @track LOADING_NEW_PAGE;
  get loading() {
    return this.LOADING_NEW_PAGE ?? false
  }

  @wire(getListInfoByName, { objectApiName, listViewApiName })
  __LIST_MXN_INFO_WIRED_RESULTS__;

  @wire(getListRecordsByName, { 
    objectApiName, 
    listViewApiName, 
    optionalFields: optionalFields ?? null,
    sortBy: '$SortedBy',
    searchTerm: '$searchTerm',
    pageSize: '$pageSize', 
    pageToken: '$PageToken'
  })
  __LIST_MXN_RECORDS_WIRED_RESULTS__;

  @wire(getRecords, { records: '$__LIST_MXN_RECORDS_PARAM__' })
  __LIST_MXN_RECORDS__;
  sortDirection = 'asc';
  defaultSortDirection = 'asc';
  sortedBy;

  get SortedBy() {
    if(this.sortedBy !== undefined) {
      const sign = this.sortDirection === 'desc' ? '-' : '';
      return [`${sign}${this.sortedBy}`]
    }
    const sign = sort?.direction === 'desc' ? '-' : '';
    return sort?.by !== undefined 
      ? [`${sign}${sort?.by}`]
      : undefined;
  }
  
  get __LIST_MXN_DONE__() { 
    return this.ListViewFields !== undefined &&
    this.__LIST_MXN_RECORD_IDS__ instanceof Array && 
    this.ListViewData instanceof Array
  }

  get __LIST_MXN_RECORDS_PARAM__() {
    return this.__LIST_MXN_RECORD_IDS__ !== undefined && this.ListViewFields !== undefined ? [ { 
      recordIds: this.__LIST_MXN_RECORD_IDS__, 
      fields: this.ListViewFields?.concat([{objectApiName, fieldApiName: 'Id'}], optionalFields ?? [])
    } ] : undefined;
  }
  get __LIST_MXN_RECORD_IDS__() { 
    return this.__LIST_MXN_RECORDS_WIRED_RESULTS__?.data?.records instanceof Array && this.__LIST_MXN_RECORDS_WIRED_RESULTS__?.data?.records.length >= 1
      ? this.__LIST_MXN_RECORDS_WIRED_RESULTS__?.data?.records.map(({id}) => id)
      : [] 
  }
  get NextPageToken() {
    return this.__LIST_MXN_RECORDS_WIRED_RESULTS__?.data?.nextPageToken ?? undefined;
  }
  get PreviousPageToken() {
    return this.__LIST_MXN_RECORDS_WIRED_RESULTS__?.data?.previousPageToken ?? undefined;
  }
  get PageToken() { return this.pageToken; }
  set PageToken(v) {
    this.LOADING_NEW_PAGE = true;
    this.pageToken = v;
  }
  get FirstPage() { return this.PreviousPageToken === undefined };
  get LastPage() { return this.NextPageToken === undefined };

  get PreviousFirstRowId() {return this.previousFirstRowId; }
  set PreviousFirstRowId(v) {
    this.previousFirstRowId = this.currentFirstRowId;
    if(v === this.actualFirstRowId) 
      this.currentFirstRowId = v;
    if(this.previousFirstRowId && this.actualFirstRowId !== this.previousFirstRowId) 
      this.LOADING_NEW_PAGE = false
  }
  get ListViewLabel() { return this.__LIST_MXN_INFO_WIRED_RESULTS__?.data?.label; }

  get ListViewFields() {
    return this.__LIST_MXN_INFO_WIRED_RESULTS__?.data?.displayColumns.map(({fieldApiName}) => ({
      fieldApiName,
      objectApiName
    }));
  }
  get ListViewData() {
    const ready = this.__LIST_MXN_RECORDS_WIRED_RESULTS__?.data?.records instanceof Array && this.__LIST_MXN_RECORDS_WIRED_RESULTS__?.data?.records.length >= 1;
    const data = this.__LIST_MXN_RECORDS__?.data?.results?.map(({result: {fields}}) => 
        Object.fromEntries(
          Object.entries(fields).map(([fieldApiName, {displayValue, value}]) => [
            fieldApiName, displayValue === null ? value : displayValue
          ])
        )
      )
      // .sort(this.sortBy(this.sortedBy, this.sortDirection === 'asc' ? 1 : -1)) ?? undefined;
    if(ready) {
       this.actualFirstRowId = data?.[0]?.Id;
       this.PreviousFirstRowId = data?.[0]?.Id;
    }
    return ready
      ? data
      : []
  }
  get ListViewColumns() {
    const SOBJECT_INFO = this?.[`${sanitizeApiName(objectApiName)}info`];
    const get = (key, field) => SOBJECT_INFO[field][key];
    const DATE_FIELD = field => ['Date','DateTime'].includes(get('dataType', field));

    return SOBJECT_INFO !== undefined 
      ? this.ListViewFields?.map(({fieldApiName}) => {
        if(this.TURFU_MODE && this.loading) {
          return {
            type: 'loadingState',
            fieldName: fieldApiName,
            label: get('label', fieldApiName, objectApiName),
            cellAttributes: { alignment: 'center' }
          }
        }
        return (this?.customColumns?.[fieldApiName] ?? {
          type: dataTypeToColumnType[get('dataType', fieldApiName, objectApiName)] ?? 'text',
          fieldName: fieldApiName,
          label: get('label', fieldApiName, objectApiName),
          sortable: true,
          typeAttributes: !DATE_FIELD(fieldApiName) ? {} : {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
          },
          cellAttributes: { alignment: 'center' }
        })
      }) 
    : undefined
  }
  get pageSizeOptions() {
    return Array.from({length:10}, (_,i) => ({label:(i+1)*10,value:(i+1)*10}))
  }
  get pageSize() { return +this._pageSize; }
  set pageSize(v) { this._pageSize = v; }
  handleSort ({detail: {fieldName, sortDirection}}) {
    this.sortDirection = sortDirection;
    this.sortedBy = fieldName;
  }
  sortBy (field, direction, primer) {
    const key = primer
        ? x => primer(x[field]) 
        : x => x[field]; 
    return (a, b) => {
        a = key(a);
        b = key(b);
        return direction * ((a > b) - (b > a));
    };
  }
}
