import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps } from "react";
import { StyleProp, ViewStyle } from "react-native";

/**
 * Maps SF Symbol names to Ionicons names for cross-platform support.
 * Add new mappings as needed.
 */
const ICON_MAPPING: Record<string, ComponentProps<typeof Ionicons>["name"]> = {
  "house.fill": "home",
  "chart.line.uptrend.xyaxis": "trending-up",
  "chevron.right": "chevron-forward",
  "chevron.down": "chevron-down",
};

interface IconSymbolProps {
  name: keyof typeof ICON_MAPPING;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cross-platform icon component.
 * Uses SF Symbols naming convention but renders Ionicons on all platforms.
 */
export function IconSymbol({ name, size = 24, color, style }: IconSymbolProps) {
  const ionName = ICON_MAPPING[name] ?? "help-circle";

  return (
    <Ionicons
      name={ionName}
      size={size}
      color={color}
      style={style as ComponentProps<typeof Ionicons>["style"]}
    />
  );
}
