import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  total: number;
  isListening: boolean;
  uniqueApps: number;
}

export default function StatsBar({ total, isListening, uniqueApps }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.stat}>
        <Feather name="list" size={14} color={colors.primary} />
        <Text style={[styles.value, { color: colors.foreground }]}>{total}</Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Bildirim</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.stat}>
        <Feather name="grid" size={14} color={colors.primary} />
        <Text style={[styles.value, { color: colors.foreground }]}>{uniqueApps}</Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Uygulama</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.stat}>
        <View style={[styles.dot, { backgroundColor: isListening ? colors.success : colors.destructive }]} />
        <Text style={[styles.value, { color: isListening ? colors.success : colors.destructive }]}>
          {isListening ? "Aktif" : "Pasif"}
        </Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Durum</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  stat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  divider: {
    width: 1,
    height: 24,
    alignSelf: "center",
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
