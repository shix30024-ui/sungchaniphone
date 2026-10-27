export const SYSTEM_KEY = "phone-system-settings-v1";
export type SystemSettings = { airplane: boolean; wifi: boolean; bluetooth: boolean };
export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = { airplane: false, wifi: true, bluetooth: true };