import { pick } from "../pick.js";
/**
 * Useful method to pass as an input a custom label formated as an ES6 template literal
 * like this : Hello ${name}
 * Take an object of the shape as a second parameter : {name: 'John Doe'}
 * @param {string} input
 * @param {Object} params
 * @returns {string}
 */
export const _interpolate = (input, params) => {
  const names = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...names, `return \`${input}\`;`)(...vals);
};
export const _interpolateFrom = (input, target) =>
  interpolate(
    input,
    pick(...Array.from(input.matchAll(/\${(.*?)}/g), ([, v]) => v)).from(
      target,
    ),
  );

export const interpolate = (input, params = undefined) =>
  params === undefined
    ? { withValuesFrom: (obj) => _interpolateFrom(input, obj) }
    : _interpolate(input, params);
