import { T } from './utils/template.js';

export const LOADED_DATA_INVALID          = T('Cannot validate the loaded data. It may be corrupt. Restore the data from backup or regenerate it.');
export const SAVED_DATA_NOT_DETECTED      = T('Cannot detect the saved data. Make sure the data was saved before loading.');
export const MULTIPLE_SAVED_DATA_DETECTED = T('Multiple variants of the saved data detected. Restore the data from backup or regenerate it.');