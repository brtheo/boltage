export const boolPropsReducer = (self) => [
  (acc, prop) => acc && self?.[prop],
  true
]

export const allMxnDone = (self, maybeSuspendedMixins) =>
  maybeSuspendedMixins
    .filter(mxnProp => mxnProp in self)
    .reduce(...boolPropsReducer(self))