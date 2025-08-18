import { Theme } from "./base.theme.model";
import { BroadTheme } from "./broad.theme.model";
import { Catalog } from "./catalog.theme.model";
import { Componenet } from "./componenet.theme.model";
import { FocusArea } from "./focus.area.theme.model";

export function initializeThemeModels() {
  // Just importing them is enough to register the discriminators
  return {
    Catalog,
    BroadTheme,
    Componenet,
    FocusArea
  };
}