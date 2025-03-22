export const trace = (name, obj) =>
  console.error(name, JSON.parse(JSON.stringify(obj)));