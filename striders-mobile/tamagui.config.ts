import { createTamagui } from "tamagui";
import { defaultConfig } from "@tamagui/config/v4";

const stridersTeal = "#00A290";

export const config = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    striders: {
      background: stridersTeal,
      backgroundHover: "#008272",
      backgroundPress: "#006B5E",
      backgroundFocus: "#008272",
      color: "#FFFFFF",
      colorHover: "#FFFFFF",
      colorPress: "#EEEEEE",
      colorFocus: "#FFFFFF",
      borderColor: stridersTeal,
      borderColorHover: "#008272",
      borderColorPress: "#006B5E",
      borderColorFocus: "#008272",
    },
  },
});

export type Conf = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
