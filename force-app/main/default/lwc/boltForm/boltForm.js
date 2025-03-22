import { LightningElement, api } from 'lwc';
import { mix, useFormValidation } from 'c/bolt';

export default class BoltForm extends mix([useFormValidation], LightningElement) {

  @api watch;
  @api record;
  @api records;
  get _record() {
    return this.record ?? this.records.reduce((records, record) =>
      Object.assign(records, record), {}
    )
  }
  get recordFields () {
    return Object.values(this._record);
  }
  @api get validity() {
    return this.formValidity;
  }

  connectedCallback() {
    if(this.watch) {
      this.template.addEventListener('boltbind', (e) => {
        const {
          detail: {
            mode,
            recordField: [objectApiName, fieldValue]
          }
        } = e;
        const [fieldApiName] = Object.keys(fieldValue);
        if(this.watch.includes(fieldApiName)) {
          e.stopImmediatePropagation();
          this.dispatchEvent(new CustomEvent(fieldApiName.toLowerCase(), {
            detail: {
              value: fieldValue[fieldApiName],
              next: {
                detail: {
                  mode,
                  recordField: [objectApiName, fieldValue]
                }
              }
            }
          }))
        }
      })
    }
  }
}