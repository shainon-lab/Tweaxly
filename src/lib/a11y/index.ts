export { AccessibilityProvider, useA11y } from "./provider";
export { default as AccessibilityWidget } from "./Widget";
export { default as AccessibilityWidgetGate } from "./WidgetGate";
export { A11Y_INIT_SCRIPT } from "./init-script";
export {
  readA11yWidgetEnabled,
  setA11yWidgetEnabled,
  onA11yWidgetToggle,
  requestA11yWidgetOpen,
} from "./visibilityStore";
export type { A11yPrefs, ContrastMode, FontScale, CursorSize } from "./types";
