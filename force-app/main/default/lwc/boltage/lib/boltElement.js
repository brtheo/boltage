import { LightningElement} from 'lwc';
import { sanitizeApiName } from './utils/_';
import {Toaster} from './utils/public/toaster';
import { SaveOnChange } from './mixins/useForm';
import { UsedObjectApiName } from './mixins/useRecordFields';

/** @type {AbortController | null} */
let abortController = null;
let timeoutId = null;
const onAbort = reject => () => {
  clearTimeout(timeoutId);
  reject(console.info('Signal Aborted'))
}
const RECURSIVE_DEPENDENCIES = {'RECURSIVE_DEPENDENCIES':''};
/**
 * @typedef {String} ObjectApiName
 * @typedef {{[key:String]:any}} FieldValue
 * @typedef BoltBindEventDetail
 * @prop {'edit' | 'insert'} mode
 * @prop {Array<string>} controls
 * @prop {[ObjectApiName, FieldValue]} recordField
 */
function resolveDependencies(controls, objectApiName, target, fieldValue = RECURSIVE_DEPENDENCIES) {
  for(const control of controls) {
    const fieldRef = this.refs.form.getInputRef(objectApiName,control);
    const isOk = fieldRef.execTrigger(fieldValue);
    const currentValue = fieldRef.getCurrentValue();
    // console.log('currentValue', currentValue,'isok',isOk, 'contr', control)
    if(fieldRef.controls?.[0]) {
      resolveDependencies.call(this, fieldRef.controls, objectApiName, target)
    }
    this[target] = (!isOk)
      ? Object.fromEntries(
          Object.entries(this[target])
            .filter(([key]) => key !== control)
      )
      : {...this[target], [control]: currentValue}
    }
}

/**
 * @param {CustomEvent<BoltBindEventDetail>} param
 */
function $bind({
  detail: {
    mode,
    controls,
    recordField: [objectApiName, fieldValue]
  }
}) {
  const target = mode === 'edit'
    ? objectApiName
    : `${sanitizeApiName(objectApiName)}ref`;
  if(controls !== undefined) {
    resolveDependencies.call(this, controls, objectApiName, target, fieldValue);
  }

  if(this?.[target])
    this[target] = Object.assign(
      {...this[target]},
      fieldValue
    );

}
export class BoltElement extends LightningElement {
  skeletonRows = 2;
  skeletonLabels = true;
  usingSkeletons = false;

  /**
   * When called, continues the binding mechanism in case a field update was listened for
   * @param {CustomEvent<{detail:{next:CustomEvent<BoltBindEventDetail>}}>} e
   */
  next(e) {
    $bind.call(this, e.detail.next);
  }
    autoSavedCallback() {
      Toaster.success.call(this, 'Saved !')
    }

  connectedCallback() {
    // Default binding mechanism for any non specifically listened field updates
    this.template.addEventListener('boltbind', async (e) => {
      $bind.call(this,e);
      if(this[SaveOnChange]) {
        if(abortController)
          abortController.abort();
        clearTimeout(timeoutId)

        abortController = new AbortController();
        const {signal} = abortController;
        try {
          await new Promise((resolve, reject) => {
            timeoutId = setTimeout(() => {
              resolve(
                this.saveRecord(
                  this[this?.[UsedObjectApiName]]
                )
              );
              this.autoSavedCallback(e);
            }, 1500);
            signal.onabort = onAbort(reject)
          })
        } catch(err) {} finally {
          if (abortController?.signal.aborted === false) {
            abortController = null;
          }
        }
      }
    })
    this.template.addEventListener('all-settled', () => {
      if('__SET_EXTERNAL_STYLES__' in this) this.__SET_EXTERNAL_STYLES__();
      if('suspendedCallback' in this) this.suspendedCallback();
    })
  }
}