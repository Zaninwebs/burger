import { DEFAULT_SETTINGS, type Settings } from "../shared/reservations.ts";
import { store } from "./store.ts";

/** Saved operator settings merged over the defaults (new fields get their default). */
export async function getSettings(): Promise<Settings> {
  const saved = await store().get<Partial<Settings>>("settings");
  return { ...DEFAULT_SETTINGS, ...saved, weekdays: { ...DEFAULT_SETTINGS.weekdays, ...saved?.weekdays } };
}
