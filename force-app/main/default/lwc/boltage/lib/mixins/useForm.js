import {
  mix,
  sanitizeApiName,
  getStack,
  createFieldsByObjectApiName,
  allMxnDone,
  boolPropsReducer,
  db
} from "../utils/_";
import {useDML} from '../mixins/_';
import {track} from 'lwc';

export const SaveOnChange = Symbol();

const isOfMultipleSObject = fields => fields?.[0] instanceof Array;

/** @type {DataTypeToInputType} */
const dataTypeToInputType = {
  String: 'text',
  Double: 'number',
  Boolean: 'toggle',
  Currency: 'number',
  Phone: 'tel',
}

const getMaybeSuspendedMixins = (isOfMultipleSObject, isInsert) => [
  ['__SOBJECTS_MXN_DONE__','__RECORDS_FIELDS_MXN_DONE__'],
  ['__SOBJECT_MXN_DONE__','__RECORD_FIELDS_MXN_DONE__']
].toSpliced(+isOfMultipleSObject,1)[0].toSpliced(+isInsert, isInsert ? 1 : -1 )

const insertArg = (fields, isOfMultipleSObject, objectApiName) => ({
    [isOfMultipleSObject ? 'SObjects' : 'SObject']: {fields, objectApiName},
  });

const editArg = (fields, isOfMultipleSObject, objectApiName) => ({
    [isOfMultipleSObject ? 'recordsFields' : 'recordFields']: {fields, objectApiName},
    ...insertArg(fields, isOfMultipleSObject, objectApiName)
  });

const singleSObjectForm = (
  _fields,
  mode,
  mixed,
  maybeSuspendedMxn,
  _objectApiName,
  boltFormError,
  customValidityReporting,
  formRef,
  asyncErrors,
  saveOnChange
) => {
  const isDynamic = typeof _fields === 'function';
  const objectApiName = isDynamic ? _objectApiName : _fields[0].objectApiName;
  const objectInfoName = `${sanitizeApiName(objectApiName)}info`;
  const inputObjectApiName = `$${objectApiName}`;

  const clazz = class extends mixed {
    @track formErrors;
    [SaveOnChange] = saveOnChange;
    get __FORM_MXN_DONE__() { return this[inputObjectApiName] !== undefined;}
    async submit() {
      if(this.refs[formRef].validity) {
        try {
          await this.saveRecord(this[objectApiName], objectApiName)
          this.formErrors = [];
        } catch(err) {
          console.error(err);
          if(asyncErrors) {
            const {fieldErrors} = err.body.output;
            this.formErrors = Object.entries(fieldErrors);
            for(const [field, errors] of this.formErrors) {
              this.refs[formRef].getInputRef(objectApiName,field)
                .setCustomValidity(customValidityReporting
                  ? ' '
                  : boltFormError
                  ? errors.map(({message}) => message)
                  : errors.map(({message}) => message).join('\n')
                ).reportValidity();
            }
          }
        }
      }
    }
    withDefaultValues(record, defaultValues) {
      return Object.fromEntries(Object.entries(record).map(([fieldApiName, fieldDefinition]) =>
        [fieldApiName,{
          ...fieldDefinition,
          ...defaultValues?.[fieldApiName] ?? {}
        }]
      ))
    }
  };

  Object.defineProperty(clazz.prototype, inputObjectApiName, {
    get() {
      if(allMxnDone(this, maybeSuspendedMxn)) {
        const fields = isDynamic ? _fields(this) : _fields;
        const test = isDynamic && fields !== undefined ? fields?.[0]?.fieldApiName : '';
        const ready = isDynamic
          ? fields !== undefined && this?.[objectInfoName]?.[test] !== undefined
          : true;
        const ret = ready ? Object.fromEntries(fields.map(({fieldApiName}) => {
          const {label, dataType, values} = this?.[objectInfoName]?.[fieldApiName];
          const value = this?.[objectApiName]?.[fieldApiName];
          return [
            fieldApiName,
            {
              info: {
                label,
                type: dataTypeToInputType[dataType] ?? dataType.toLowerCase(),
                options: values
              },
              ref:'',
              value,
              fieldApiName,
              objectApiName,
              mode
            },
          ]
        })) : {}
        return ret;
      }else return undefined

    }
  })
  return clazz;
}
const multipleSObjectForm = (fields, mode, mixed, maybeSuspendedMxn) => {
  const fieldsByObjectApiName = createFieldsByObjectApiName(fields);
  const objectApiNames = Object.keys(fieldsByObjectApiName);
  const objectInfoNames = Object.fromEntries(objectApiNames.map(name => [name, `${sanitizeApiName(name)}info`]));
  const inputObjectApiNames = Object.fromEntries(objectApiNames.map(name => [name, `$${name}`]));
  const clazz = class extends mixed {
    get __FORM_MXN_DONE__() {
      return Object.values(inputObjectApiNames).reduce(...boolPropsReducer(this));
    }
  };
  objectApiNames.forEach(name => {
    Object.defineProperty(clazz.prototype, inputObjectApiNames[name], {
      get() {
        if(allMxnDone(this, maybeSuspendedMxn)) {
          const fields = fieldsByObjectApiName[name];
          const objectInfoName = objectInfoNames[name];
          const test = fields?.[0]?.fieldApiName;
          const ready = this?.[objectInfoName]?.[test] !== undefined;
          return Object.fromEntries(fields.map(({fieldApiName}) => {
            const {label, dataType, values} = this?.[objectInfoName]?.[fieldApiName];
            const value = this?.[name]?.[fieldApiName];
            return [fieldApiName, {
              info: {
                label,
                type: dataTypeToInputType[dataType] ?? dataType.toLowerCase(),
                options: values
              },
              ref:'',
              value,
              fieldApiName,
              name,
              mode
            }];
          }));
        }
      }
    })
  })
  return clazz;
}

const mergeSupportiveFields = (isOfMultipleSObject, fields, supportiveFields) =>
  isOfMultipleSObject && supportiveFields
    ? fields.map((_fields,i) => _fields.concat(supportiveFields[i]))
    : fields

/**
 * @param {Constructor<any>} constructor
 * @param {{fields, mode, supportiveFields, objectApiName}} fields
 * @returns
 */
export const useForm = args => clazz => {
  const mode = args?.mode ?? 'edit';
  const {fields} = args;


  if(args?.supportiveFields && args.supportiveFields?.at(0) instanceof Object)
    args.supportiveFields = args.supportiveFields.map(({fieldApiName}) => fieldApiName)

  const _isOfMultipleSObject = typeof args.fields === 'function'
    ? false
    : isOfMultipleSObject(fields);
  const mixed = mix(
    clazz,
    ...getStack({
      'insert': insertArg(mergeSupportiveFields(
        _isOfMultipleSObject,
        fields,
        args?.supportiveFields
      ), _isOfMultipleSObject, args?.objectApiName),
      'edit': editArg(mergeSupportiveFields(
        _isOfMultipleSObject,
        fields,
        args?.supportiveFields
      ), _isOfMultipleSObject, args?.objectApiName)
    }[mode])
  );
  const maybeSuspendedMxn = getMaybeSuspendedMixins(_isOfMultipleSObject, mode === 'insert');
  return useDML([
    singleSObjectForm,
    multipleSObjectForm
  ][+_isOfMultipleSObject](
    fields,
    mode,
    mixed,
    maybeSuspendedMxn,
    args?.objectApiName,
    args?.boltFormError ?? true,
    args?.customValidityReporting ?? false,
    args?.formRef ?? 'form',
    args?.asyncErrors ?? false,
    args?.saveOnChange ?? false
  ))
}