/**
 * @author Br.Theo
 * @repo https://github.com/brtheo/bolt
 * @url https://brtheo.github.io/bolt/
 * @description Bolt is a set of reusable mixins to boost LWC developpment velocity
 */

import _untilTemplate from './lib/untilTemplate.html'
export const untilTemplate = _untilTemplate;

export { BoltElement } from './lib/boltElement';

export {
  useDataBinding,
  useDML,
  useForm,
  useFormValidation,
  usePoller,
  useRecordFields,
  useRecordsFields,
  useRelatedRecords,
  useSObject,
  useSObjects,
  useState,
  useStyles,
  useSuspense
} from './lib/mixins/_';

export {
  createModal,
  createForm
} from './lib/factories/_';

export {
  Toaster,
  comboboxify,
  interpolate,
  pick,
  setExternalStyles,
  mix,
  db,
  css
} from './lib/utils/_';
