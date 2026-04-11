import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SavedNotification } from "@/types/notification";
import { useColors } from "@/hooks/useColors";

interface Props {
  notification: SavedNotification;
  onDelete: (id: string) => void;
  onPress: (notification: SavedNotification) => void;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function getAppInitial(name: string): string {
  return name.charAt(0).toUpperCase() || "?";
}

const APP_COLORS = [
  "#1e40af", "#7c3aed", "#be185d", "#047857", "#b45309",
  "#dc2626", "#0891b2", "#4338ca", "#c026d3", "#0d9488",
];

function getColorForApp(packageName: string): string {
  let hash = 0;
  for (let i = 0; i < packageName.length; i++) {
    hash = packageName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return APP_COLORS[Math.abs(hash) % APP_COLORS.length];
}

export default function NotificationCard({ notification, onDelete, onPress }: Props) {
  const colors = useColors();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleLongPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      "Bildirimi Sil",
      `"${notification.title || notification.appName}" bildirimini silmek istiyor musunuz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            onDelete(notification.id);
          },
        },
      ]
    );
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const appColor = getColorForApp(notification.packageName || notification.appName);
  const mainText = notification.bigText || notification.text;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={() => onPress(notification)}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={[styles.appIcon, { backgroundColor: appColor }]}>
              <Text style={styles.appInitial}>{getAppInitial(notification.appName)}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.appName, { color: colors.primary }]} numberOfLines={1}>
                {notification.appName || notification.packageName || "Bilinmiyor"}
              </Text>
              {notification.packageName ? (
                <Text style={[styles.packageName, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {notification.packageName}
                </Text>
              ) : null}
            </View>
            <View style={styles.timeContainer}>
              <Text style={[styles.time, { color: colors.mutedForeground }]}>
                {formatTime(notification.receivedAt)}
              </Text>
              <TouchableOpacity
                onPress={handleLongPress}
                style={styles.deleteBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {notification.title ? (
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
              {notification.title}
            </Text>
          ) : null}

          {mainText ? (
            <Text style={[styles.text, { color: colors.mutedForeground }]} numberOfLines={3}>
              {mainText}
            </Text>
          ) : null}

          {notification.subText ? (
            <Text style={[styles.subText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {notification.subText}
            </Text>
          ) : null}

          <View style={styles.footer}>
            {notification.category ? (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={[styles.badgeText, { color: colors.accentForeground }]}>
                  {notification.category}
                </Text>
              </View>
            ) : null}
            {notification.isOngoing ? (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={[styles.badgeText, { color: colors.accentForeground }]}>Devam eden</Text>
              </View>
            ) : null}
            {notification.priority !== 0 ? (
              <View style={[styles.badge, {
                backgroundColor: notification.priority > 0 ? "#fef3c7" : "#f1f5f9"
              }]}>
                <Text style={[styles.badgeText, {
                  color: notification.priority > 0 ? "#92400e" : "#64748b"
                }]}>
                  {notification.priority > 0 ? "Yüksek öncelik" : "Düşük öncelik"}
                </Text>
              </View>
            ) : null}
            {notification.actions.length > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                  {notification.actions.length} eylem
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  appInitial: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  appName: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  packageName: {
    fontSize: 10,
    marginTop: 1,
  },
  timeContainer: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
    marginLeft: 8,
  },
  time: {
    fontSize: 10,
    textAlign: "right",
  },
  deleteBtn: {
    padding: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 20,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  subText: {
    fontSize: 11,
    marginBottom: 4,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
