export const isCustomObject = (objectApiName) => objectApiName.endsWith('__c');

export const trimCustomIdentifier = (objectApiName, until = -1) => objectApiName.slice(0,until);

export const sanitizeApiName = (objectApiName) =>
  isCustomObject(objectApiName)
    ? trimCustomIdentifier(objectApiName)
    : `${objectApiName}__`;

export const sanitizeApiNameCamelCase = (objectApiName) =>
  isCustomObject(objectApiName)
    ? trimCustomIdentifier(objectApiName, -3)
    : `${objectApiName}`;

export const createFieldsByObjectApiName = arr =>
  arr.reduce((acc, curr) =>
    Object.assign(acc, Object.fromEntries([[curr[0].objectApiName, curr]])),
  {})