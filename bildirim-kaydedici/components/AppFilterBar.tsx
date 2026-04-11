import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface AppInfo {
  packageName: string;
  appName: string;
  count: number;
}

interface Props {
  apps: AppInfo[];
  selectedApp: string | null;
  onSelect: (pkg: string | null) => void;
}

export default function AppFilterBar({ apps, selectedApp, onSelect }: Props) {
  const colors = useColors();

  if (apps.length === 0) return null;

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor: selectedApp === null ? colors.primary : colors.muted,
              borderColor: selectedApp === null ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onSelect(null)}
        >
          <Text style={[styles.chipText, { color: selectedApp === null ? "#fff" : colors.foreground }]}>
            Tümü
          </Text>
        </TouchableOpacity>
        {apps.map((app) => (
          <TouchableOpacity
            key={app.packageName}
            style={[
              styles.chip,
              {
                backgroundColor: selectedApp === app.packageName ? colors.primary : colors.muted,
                borderColor: selectedApp === app.packageName ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onSelect(app.packageName)}
          >
            <Text
              style={[
                styles.chipText,
                { color: selectedApp === app.packageName ? "#fff" : colors.foreground },
              ]}
              numberOfLines={1}
            >
              {app.appName}
            </Text>
            <View style={[styles.badge, {
              backgroundColor: selectedApp === app.packageName ? "rgba(255,255,255,0.25)" : colors.secondary
            }]}>
              <Text style={[styles.badgeText, {
                color: selectedApp === app.packageName ? "#fff" : colors.mutedForeground
              }]}>
                {app.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
  },
  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 120,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
