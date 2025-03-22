import {
  useSObject,
  useSObjects,
  usePoller,
  useStyles,
  useRecordFields,
  useRecordsFields,
  useRelatedRecords
} from "../../mixins/_";
export function getStack(args) {
  const stack = [];
  if(args?.recordFields) stack.push(useRecordFields(args.recordFields));
  if(args?.recordsFields) stack.push(useRecordsFields(args.recordsFields));
  if(args?.SObject) stack.push(useSObject(args.SObject));
  if(args?.SObjects) stack.push(useSObjects(args.SObjects));
  if(args?.relatedRecords) stack.push(useRelatedRecords(args.relatedRecords));
  if(args?.styles) stack.push(useStyles(args.styles));
  if(args?.poller) stack.push(usePoller(args.poller));
  return stack;
}