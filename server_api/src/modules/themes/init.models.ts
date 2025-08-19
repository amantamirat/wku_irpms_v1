import { BroadTheme, Componenet, FocusArea } from "./child.theme.model";
import { Catalog } from "./catalog.theme.model";


export function initializeThemeModels() {
  // Just importing them is enough to register the discriminators
  return {
    Catalog,
    BroadTheme,
    Componenet,
    FocusArea
  };
}