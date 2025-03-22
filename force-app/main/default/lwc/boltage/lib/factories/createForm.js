import {
  useDML,
  useForm,
  useFormValidation,
  useSuspense
} from "../mixins/_";
import { mix } from "../utils/_";
import { BoltElement } from "../boltElement";
import _untilTemplate from '../untilTemplate.html';
/**
 *
 * @param {{fields: Field[] | Field[][],supportiveFields?: Field[] | Field[][], template: Function, untilTemplate?: Function, mode?: FormMode}} params
 * @param {{
  fields: Array<Field>,
  supportiveFields: Array<Field>,
  template,
  untilTemplate,
  mode
}} args
 * @returns {Constructor<any>}
 */
export const createForm = args => mix(
  BoltElement,
  useForm({
    fields: args.fields,
    mode: args?.mode ?? 'edit',
    supportiveFields: args?.supportiveFields ?? []
  }),
  useDML,
  useFormValidation,
  useSuspense({
    template,
    untilTemplate: untilTemplate ?? _untilTemplate
  })
);