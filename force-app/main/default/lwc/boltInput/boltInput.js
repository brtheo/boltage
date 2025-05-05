import { LightningElement, api } from 'lwc';
import inputTemplate from './boltInput.html';
import comboboxTemplate from './boltCombobox.html';
import radioGroupTemplate from './boltRadioGroup.html';
import recordPickerTemplate from './boltRecordPicker.html';
const For = delay => new Promise(() => setTimeout(() => {}, delay));

const OPS_MAP = {
  gt: (x,y) => x > y,
  lt: (x,y) => x < y,
  geq: (x,y) => x >= y,
  leq: (x,y) => x <= y
};
const OPS = Object.keys(OPS_MAP);

const checkOperators = op => OPS.includes(op);

const R = "Symbol(RECURSIVE_DEPENDENCIES)";

/**
 * @typedef {String} ObjectApiName
 * @typedef {{[key:String]:any}} FieldValue
 * @typedef BoltBindEventDetail
 * @prop {'edit' | 'insert'} mode
 * @prop {[ObjectApiName, FieldValue]} recordField
 */


export default class BoltInput extends LightningElement {
  /**BOLT PROPS */
  /** @type {'insert' | 'edit'} */ @api mode  = 'edit';
  /** @type {'combobox' | 'radio'} */ @api shape  = 'combobox';
  /**SPREADED PROPS */
  @api info;
  @api ref;
  @api value;
  @api objectApiName;
  @api fieldApiName;
  @api showsWhen;
  @api controls;
  @api _dataset;
  @api index;
  @api totalFields;

  /**OVERRIDABLE SPREADED PROPS */
  @api label;
  @api type;
  @api options;
  @api isWatched = false;

  get RecordPickerObjectApiName() {
    return this.recordPickerObjectApiName !== undefined
      ? this.recordPickerObjectApiName
      : this.fieldApiName;
  }
  get currentValue() {
    return {
      'insert': 'ref',
      'edit': 'value'
    }[this.mode];
  }
  get initialValue() { return this[this.currentValue]; }
  @api getCurrentValue() { return this.initialValue;}

  @api execTrigger(fieldValue) {
    const [testingKey,testingValue] = Object.entries(fieldValue)?.[0];
    const [actualKey, actualValue] = Object.entries(this.showsWhen)?.[0];
    let isEqual;
    if(testingKey === actualKey) {
      if(Object.keys(actualValue).some(checkOperators)) {
        const operator = Object.keys(actualValue).find(checkOperators);
        const fun = OPS_MAP[operator];
        isEqual = fun(+testingValue, actualValue[operator]);
      } else {
        isEqual = (
          typeof actualValue === 'number'
            ? +testingValue
            : testingValue
        ) === actualValue;
      }
    } else if(testingKey === 'RECURSIVE_DEPENDENCIES') isEqual = false;
    this.setDynamicVisibility(!isEqual);
    return isEqual;
  }

  setDynamicVisibility(value) {
    this.setAttribute('data-hidden', value);
    // this.classList.toggle('hidden-workaround',value)
  }

  render() {
    switch(this.Type) {
      case 'reference':
        return recordPickerTemplate;
      case 'picklist':
        return {
          'combobox': comboboxTemplate,
          'radio': radioGroupTemplate
        }[this.shape];
      default: return inputTemplate;
    }
  }

  connectedCallback() {
    this.setDynamicVisibility(this?.showsWhen instanceof Object);
    this.setAttribute('field', this.Name);
    this.classList.add(this.Name);
    if(this._dataset) {
      for(const [key, val] of Object.entries(this._dataset)) {
        this.setAttribute(`data-${key}`,val);
      }
    }
  }
  #hasInit = false;
  renderedCallback() {
    if(!this.#hasInit) {
      if(this.isWatched && this.value !== undefined) {
        // console.log(this.value, 'initial value', this.fieldApiName)
        const prop = {
          'reference': 'recordId',
          'toggle': 'checked',
        }[this.Type] ?? 'value';
        this.bind({
          detail: {[prop]: this.value}
        });
      } 
      if(this.index !== undefined && this.index === this.totalFields) {
        this.dispatchEvent(
          new CustomEvent('formrendered', {
            bubbles: true, composed: true,
            detail: true
          })
        )
      }
      this.#hasInit = true;
    }
  }

  @api triggerBinding() {
    const prop = {
      'reference': 'recordId',
      'toggle': 'checked',
    }[this.Type] ?? 'value';
    this.bind({
      detail: {[prop]: this[this.currentValue]}
    });
  }

  bind(e) {
    this[this.currentValue] = {
      'reference': e.detail.recordId ?? undefined,
      'toggle': e.detail.checked,
    }[this.Type] ?? e.detail.value;
    // console.log(this[this.currentValue], 'actual current value')
    /**@type {BoltBindEventDetail} */
    const detail = {
      mode: this.mode,
      controls: this.controls,
      recordField: [
        this.objectApiName,
        { [this.fieldApiName]: this[this.currentValue] },
      ]
    };
    this.dispatchEvent(
      new CustomEvent('boltbind', {
        detail,
        bubbles: true,
        cancelable: true,
        composed: true
      })
    )
  }

  hasError = false;
  errors = [];


  @api blur() {this.refs.inputRef.blur();}
  @api checkValidity() { return this.refs.inputRef.checkValidity();}
  @api focus() {this.refs.inputRef.focus();}
  @api clearValidity() {
    this.refs.inputRef.setCustomValidity('');
  }
  @api reportValidity(fromFormValidity = false) {
    this.hasError = fromFormValidity
      ? !this.refs.inputRef.reportValidity()
      : this.errors.length != 0;
    this.refs.inputRef.classList.toggle('boltHasError', this.hasError)
    return this.refs.inputRef.reportValidity();

  }
  @api setCustomValidity(message) {
    if(message instanceof Array)
      this.errors = message;
    else
      this.refs.inputRef.setCustomValidity(message);
    return this;
  }

  @api showHelpMessageIfInvalid() {this.refs.inputRef.showHelpMessageIfInvalid();}


  get Type() {return this.type ?? this.info.type;}
  get Label() {return this.label ?? this.info.label;}
  get Options() {return this.options ?? this.info.options;}
  get Name() {return this.name ?? `${this.objectApiName}.${this.fieldApiName}`;}
  /**INPUT ATTRIBUTES */
  @api accept;
  @api accessKey;
  @api ariaAutoComplete;
  @api ariaControls;
  @api ariaDescribedBy;
  @api ariaDisabled;
  @api ariaExpanded;
  @api ariaHasPopup;
  @api ariaInvalid;
  @api ariaKeyShortcuts;
  @api ariaLabel;
  @api ariaLabelledBy;
  @api ariaRoleDescription;
  @api autocomplete;
  @api checked;
  @api dateAriaControls;
  @api dateAriaDescribedBy;
  @api dateAriaLabel;
  @api dateAriaLabelledBy;
  @api dateStyle;
  @api disabled;
  @api fieldLevelHelp;
  @api files;
  @api formatFractionDigits;
  @api formatter;
  @api isLoading;
  @api max;
  @api maxLength;
  @api messageToggleActive;
  @api messageToggleInactive;
  @api messageWhenBadInput;
  @api messageWhenPatternMismatch;
  @api messageWhenRangeOverflow;
  @api messageWhenRangeUnderflow;
  @api messageWhenStepMismatch;
  @api messageWhenTooLong;
  @api messageWhenTooShort;
  @api messageWhenTypeMismatch;
  @api messageWhenValueMissing;
  @api min;
  @api minLength;
  @api multiple;
  @api name;
  @api pattern;
  @api placeholder;
  @api readOnly;
  @api required;
  @api role;
  @api selectionEnd;
  @api selectionStart;
  @api step;
  @api timeAriaControls;
  @api timeAriaDescribedBy;
  @api timeAriaLabel;
  @api timeAriaLabelledBy;
  @api timeStyle;
  @api timezone;
  @api validity;
  @api variant;
  /**COMBOBOX ATTRIBUTES */
  @api dropdownAlignment;
  @api spinnerActive;

  /**RECORD PICKER ATTR */
  @api recordPickerObjectApiName;
  @api displayInfo;
  @api filter;
  @api matchingInfo;
}