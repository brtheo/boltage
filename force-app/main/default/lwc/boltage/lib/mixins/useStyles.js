import { setExternalStyles } from "../utils/_";

/**
 * Will plug an external stylesheet to an element that has an attribute [data-style]
 * @example <caption>Basic usage</caption>
 * // lwc.html
 * <div data-style></div>
 * ...rest of my component
 * // lwc.js
 * import {useUnscopedStyling} from 'c/bolt';
 * const styles = `
 *   .toastMessage.forceActionsText{
 *     white-space : pre-line !important;
 *   }
 * `;
 * export default class lwc extends useUnscopedStyling(LightningElement, styles) {...}
 * @param {Constructor<any>} genericConstructor
 * @param {string} styles
 */
export const useStyles = styles => clazz =>
  class extends clazz {
    __SET_EXTERNAL_STYLES__() {
        setExternalStyles.call(this, styles);
    }
  }