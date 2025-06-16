# Boltage
Set of helpers/mixins for LWC developement. SObject API available in javascript.
Check out the documentation website on [boltage.dev ](https://boltage.dev )

<a href="https://githubsfdeploy.herokuapp.com">
  <img alt="Deploy to Salesforce"
       src="https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png">
</a>

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project (kinda 🤏) adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2] - 2025-06-16

### Corrected
- Corrected imports and exports

## [2.0.1] - 2025-06-13

### Added
- new parameter `datatableOptions` in `useListView` under `c/boltage`

### Corrected
- missing imports in `c/boltage/interpolate` that was resulting in a crash
- in `useListView` corrected a behaviour where `searchTerm` would be empty leading to a blank page of results

## [2.0.0] - 2025-06-08

### Breaking changes

- new way of implementing mixins

old:
```javascript
export default class myLWC extends mix(
  [useRecordFields, fields],
  BoltElement
)
```
new:
```javascript
export default class myLWC extends mix(
  BoltElement
  useRecordFields({ fields })
)
```

### Added

- new mixin `useListView` under `c/boltage`
- new method `withDefaultValues()` in  `useForm` under `c/boltage`
- new parameter `saveOnChange` in `useForm` under `c/boltage`
- new parameter `objectApiName` in [ `useForm` `useRecordFields` `useSObject` ] under `c/boltage`
- new parameter `customValidityReporting` in `useForm` under `c/boltage`
- new parameter `formRef` in `useForm` under `c/boltage`
- new parameter `asyncErrors` in `useForm` under `c/boltage`
- new hook method `pollerEndedCallback()` in `usePoller` under `c/bolt` to trigger side effect after each polling iterrations
- new hook method `autoSavedCallback` on the base class`BoltElement` to trigger side effect after each auto save when the feature is enabled
- new public method `query()` on `<c-bolt-form>`
- new public method `getInputRef()` on `<c-bolt-form>`
- `<c-bolt-input` now renders field of type `Lookup` to a `<lightning-record-picker>` input
- new public property `showsWhen` on `<c-bolt-input>` to deal with dependant fields
- new public property `controls` on `<c-bolt-input>` to deal with dependant fields
- new public property `_dataset` on `<c-bolt-input>` to pass down data attributes programmatically when rendered through `<c-bolt-form>`

### Changed

- renamed `useReactiveBinding` to `useDataBinding`
- renamed `useExternalStyles` to `useStyles`
- renamed `Bolt.cls` to `Boltage.cls`
- parameter `fields` of [ `useRecordFields` `useSObject` `useForm` ] can now be a function returning an array of fields
- changed the overall folder architecture of the `c/boltage` package

### Removed

- removed the method `soqlWithoutSharing()` from `Bolt.cls`
- removed the use of the token `WITHOUT_SHARING` from `db`
