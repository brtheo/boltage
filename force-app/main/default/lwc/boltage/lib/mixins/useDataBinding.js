import { deepMerge } from "../utils/_";
/**
 * @example <caption>Basic Usage</caption>
 * // html
 * <lightning-input
 *  data-bind="myField__c"
 *  value={myField__c}
 *  onchange={bind}
 * >Some input</lightning-input>
 * // js
 * import {useReactiveBinding} from 'c/bolt';
 * export class myLwc extends useReactiveBinding(LightningElement) {
 *  ㅤ@track myField__c // value of input will always reflect back onto the bound prop
 * }
 */
/**
 * @param {Constructor<any>} clazz
 * @returns {Constructor<any>}
 */
export const useDataBinding = clazz =>
  class extends clazz {
    /**
     * Automatically assign the changed input to the bound variable
     * @param {InputEvent} e
     */
    bind({currentTarget: {dataset: {bind}}, detail: {value}}) {
      const [head, ...tail] = bind.split('.')
      if(bind.includes('.')) {
        const copy = tail.reduceRight((prev, curr) => ({[curr]:prev}),value);
        this[head] = deepMerge([this[head], copy])
      } else {
        this[head] = value;
      }
    }
  }