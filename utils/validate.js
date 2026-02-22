// core/utils/validate.js
export function err(field, message) {
  return { field, message };
}

export function assert(condition, field, message, errors) {
  if (!condition) errors.push(err(field, message));
}
