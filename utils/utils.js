// core/utils/id.js
export function uid(prefix = "") {
  // UUID v4 simplificado sem libs
  const s = crypto?.randomUUID ? crypto.randomUUID() : (
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
  );
  return prefix ? `${prefix}_${s}` : s;
}
