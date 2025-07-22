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

export const useListView = ({
  listViewApiName, 
  objectApiName, 
  recordsPerPage, 
  optionalFields, 
  sort,
  datatableOptions: {wrapText}
}) => clazz => class extends useSObject({
  objectApiName,
  fields: self => self.ListViewFields !== undefined 
    ? self.ListViewFields?.concat(optionalFields ?? []) 
    : undefined
})(clazz) {
  @track pageToken = 0;
  @track _pageSize = recordsPerPage ?? 50;
  @track actualDataLength;
  @track currentDataLength;
  @track previousDataLength;
  @track actualFirstRowId;
  @track currentFirstRowId;
  @track previousFirstRowId;
  @track __LOADING_NEW_PAGE__;
  get LOADING_NEW_PAGE() {
    return this.__LOADING_NEW_PAGE__ ?? false
  }

  @wire(getListInfoByName, { objectApiName, listViewApiName })
  __LIST_MXN_INFO_WIRED_RESULTS__;

  @wire(getListRecordsByName, { 
    objectApiName, 
    listViewApiName, 
    optionalFields: optionalFields ?? null,
    sortBy: '$SortedBy',
    searchTerm: '$SearchTerm',
    pageSize: '$pageSize', 
    pageToken: '$PageToken',
    where: '$WhereCondition'
  })
  __LIST_MXN_RECORDS_WIRED_RESULTS__;

  @wire(getRecords, { records: '$__LIST_MXN_RECORDS_PARAM__' })
  __LIST_MXN_RECORDS__;
  sortDirection = 'asc';
  defaultSortDirection = 'asc';
  sortedBy;

  get SearchTerm() {
    return this.searchTerm === undefined || this.searchTerm === '' 
      ? undefined 
      : this.searchTerm;
  }

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
    // this.__LOADING_NEW_PAGE__ = true;
    this.pageToken = v;
  }
  get FirstPage() { return this.PreviousPageToken === undefined };
  get LastPage() { return this.NextPageToken === undefined };

  get PreviousDataLength() {return this.previousDataLength; }
  set PreviousDataLength(v) {
    this.previousDataLength = this.currentDataLength;
    if(v === this.actualDataLength) 
      this.currentDataLength = v;
    if(this.previousDataLength && this.actualDataLength !== this.previousDataLength) 
      this.__LOADING_NEW_PAGE__ = false
    else if(this.previousDataLength && this.actualDataLength === this.previousDataLength && this.firstRowHasChanged) 
      this.__LOADING_NEW_PAGE__ = false;
    
  }
  @track firstRowHasChanged = false;
  get PreviousFirstRowId() {return this.previousFirstRowId; }
  set PreviousFirstRowId(v) {
    this.previousFirstRowId = this.currentFirstRowId;
    if(v === this.actualFirstRowId) 
      this.currentFirstRowId = v;
    if(this.previousFirstRowId && this.actualFirstRowId !== this.previousFirstRowId) 
      this.firstRowHasChanged = true;
    else this.firstRowHasChanged = false;
  }
  get ListViewLabel() { return this.__LIST_MXN_INFO_WIRED_RESULTS__?.data?.label; }

  get ListViewFields() {
    return this.__LIST_MXN_INFO_WIRED_RESULTS__?.data?.displayColumns.map(({fieldApiName}) => ({
      fieldApiName,
      objectApiName
    }));
  }
  @track displayedLength;
  get ListViewData() {
    // console.log(JSON.stringify(this.__LIST_MXN_RECORDS__?.data?.results), 'error')
    const ready = this.__LIST_MXN_RECORDS_WIRED_RESULTS__?.data?.records instanceof Array && this.__LIST_MXN_RECORDS_WIRED_RESULTS__?.data?.records.length >= 1;
    const data = this.__LIST_MXN_RECORDS__?.data?.results?.map(({result: {fields}}) => 
        Object.fromEntries(
          Object.entries(fields).map(([fieldApiName, {displayValue, value}]) => [
            fieldApiName, displayValue === null ? value : displayValue
          ])
        )
      )
      // .sort(this.sortBy(this.sortedBy, this.sortDirection === 'asc' ? 1 : -1)) ?? undefined;
   
    // if(ready) {
    //   this.actualFirstRowId = data?.[0].Id;
    //   this.PreviousFirstRowId = data?.[0].Id;
    //   this.actualDataLength = data?.length;
    //   this.PreviousDataLength = data?.length;
    // }
    // console.log(ready, data?.length, 'please')
    // if(!ready || data?.length === 0) this.__LOADING_NEW_PAGE__ = false;
    return ready ? data : [];
  }
  get ListViewColumns() {
    const SOBJECT_INFO = this?.[`${sanitizeApiName(objectApiName)}info`];
    const get = (key, field) => SOBJECT_INFO[field][key];
    const DATE_FIELD = field => ['Date','DateTime'].includes(get('dataType', field));

    return SOBJECT_INFO !== undefined 
      ? this.ListViewFields?.map(({fieldApiName}) => {
        // if(this.TURFU_MODE && this.LOADING_NEW_PAGE) {
        //   return {
        //     type: 'loadingState',
        //     fieldName: fieldApiName,
        //     label: get('label', fieldApiName, objectApiName),
        //     cellAttributes: { alignment: 'center' }
        //   }
        // }
        return (this?.customColumns?.[fieldApiName] ?? {
          type: dataTypeToColumnType[get('dataType', fieldApiName, objectApiName)] ?? 'text',
          fieldName: fieldApiName,
          label: get('label', fieldApiName, objectApiName),
          sortable: true,
          wrapText,
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
}
