import { LightningElement, api } from 'lwc';
import { useFormValidation, setExternalStyles } from 'c/boltage';

export default class BoltForm extends useFormValidation(LightningElement) {

  @api watch;
  @api record;
  @api records;
  @api required;
  get _record() {
    return this.record ?? this.records.reduce((records, record) =>
      Object.assign(records, record), {}
    )
  }
  get recordFields() {
    return Object.values(this._record)
      .map(record => ({
          ...record,
          isWatched: this.watch.includes(record.fieldApiName)
      }));
  }
  @api get validity() {
    return this.formValidity;
  }
  @api query(el) {
    return this.template.querySelector(el);
  }
  @api getInputRef(objectApiName, fieldApiName) {
    return this.query(/***/`[field="${objectApiName}.${fieldApiName}"]`);
  }
  get numberOfFields() {
    return this.recordFields.length - 1
  }
  handleFormRendered() {
    console.log('form rendered')
    this.recordFields.forEach(({objectApiName, fieldApiName}) => 
      this.query(/***/`[field="${objectApiName}.${fieldApiName}"]`).triggerBinding()
    )
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
  #rendered = false;
  renderedCallback() {
    if(!this.#rendered) {
      setExternalStyles.call(this,'.slds-form-element__help {white-space: pre-line}');
      this.#rendered = true;
    }
  }
  @api clearValidity() {

  }
}