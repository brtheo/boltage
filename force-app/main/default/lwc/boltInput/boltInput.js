import { LightningElement, api } from 'lwc';
import inputTemplate from './boltInput.html';
import comboboxTemplate from './boltCombobox.html';
import radioGroupTemplate from './boltRadioGroup.html';
import recordPickerTemplate from './boltRecordPicker.html';
const For = delay => new Promise(() => setTimeout(() => {}, delay));

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

  /**OVERRIDABLE SPREADED PROPS */
  @api label;
  @api type;
  @api options;

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

  connectedCallback() {
    this.setAttribute('field', this.Name);
    this.classList.add(this.Name);
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
  bind(e) {
    this[this.currentValue] = this.Type === 'reference'
      ? e.detail.recordId
      : e.detail.value;
    /**@type {BoltBindEventDetail} */
    const detail = {
      mode: this.mode,
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

  @api blur() {this.refs.inputRef.blur();}
  @api checkValidity() { return this.refs.inputRef.checkValidity();}
  @api focus() {this.refs.inputRef.focus();}
  @api reportValidity() { return this.refs.inputRef.reportValidity();}
  @api setCustomValidity(message) {this.refs.inputRef.setCustomValidity(message);}
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
  @api recordPickerObjectApiName
}