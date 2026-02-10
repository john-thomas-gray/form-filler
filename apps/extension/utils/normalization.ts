import type { EscapeFunction } from "../types/types";

export const cssEscape: EscapeFunction = (value) => {
  const cssObj = (globalThis as any).CSS;
  if (cssObj && typeof cssObj.escape === "function") {
    return cssObj.escape(value);
  }

  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};
