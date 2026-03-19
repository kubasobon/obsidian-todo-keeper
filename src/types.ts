export interface PluginSettings {
  templateHeading: string;
  deleteOnComplete: boolean;
  removeEmptyTodos: boolean;
  rolloverChildren: boolean;
  rolloverOnFileCreate: boolean;
  doneStatusMarkers: string;
  leadingNewLine: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  templateHeading: "none",
  deleteOnComplete: false,
  removeEmptyTodos: false,
  rolloverChildren: false,
  rolloverOnFileCreate: true,
  doneStatusMarkers: "xX-",
  leadingNewLine: true,
};
