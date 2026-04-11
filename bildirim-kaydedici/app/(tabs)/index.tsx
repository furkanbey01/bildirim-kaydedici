import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFilterBar from "@/components/AppFilterBar";
import EmptyState from "@/components/EmptyState";
import NotificationCard from "@/components/NotificationCard";
import NotificationDetail from "@/components/NotificationDetail";
import StatsBar from "@/components/StatsBar";
import { useNotifications } from "@/context/NotificationContext";
import { useColors } from "@/hooks/useColors";
import { SavedNotification } from "@/types/notification";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    notifications,
    isListening,
    hasPermission,
    totalCount,
    deleteNotification,
    clearAll,
    requestPermission,
    loadMore,
    displayedCount,
  } = useNotifications();

  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<SavedNotification | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const uniqueApps = useMemo(() => {
    const map = new Map<string, { appName: string; count: number }>();
    for (const n of notifications) {
      const key = n.packageName || n.appName;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, { appName: n.appName, count: 1 });
      }
    }
    return Array.from(map.entries())
      .map(([packageName, info]) => ({ packageName, ...info }))
      .sort((a, b) => b.count - a.count);
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (!selectedApp) return notifications.slice(0, displayedCount);
    return notifications
      .filter((n) => (n.packageName || n.appName) === selectedApp)
      .slice(0, displayedCount);
  }, [notifications, selectedApp, displayedCount]);

  const handleClearAll = () => {
    Alert.alert(
      "Tümünü Temizle",
      `${totalCount} bildirimin tamamı silinecek. Bu işlem geri alınamaz.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Temizle",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await clearAll();
            setSelectedApp(null);
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: topPad + 8,
        backgroundColor: colors.card,
        borderBottomColor: colors.border
      }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Feather name="bell" size={20} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Bildirim Kaydedici
            </Text>
          </View>
          <View style={styles.headerActions}>
            {!hasPermission && (
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.accent }]}
                onPress={requestPermission}
              >
                <Feather name="settings" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
            {totalCount > 0 && (
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.muted }]}
                onPress={handleClearAll}
              >
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Stats */}
      <StatsBar
        total={totalCount}
        isListening={isListening}
        uniqueApps={uniqueApps.length}
      />

      {/* App Filter */}
      {uniqueApps.length > 1 && (
        <AppFilterBar
          apps={uniqueApps}
          selectedApp={selectedApp}
          onSelect={setSelectedApp}
        />
      )}

      {/* Notification List */}
      {notifications.length === 0 ? (
        <EmptyState
          hasPermission={hasPermission}
          onRequestPermission={requestPermission}
        />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          hasPermission={hasPermission}
          onRequestPermission={requestPermission}
          isFiltered
        />
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onDelete={deleteNotification}
              onPress={setSelectedNotif}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 20 }]}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            filteredNotifications.length < (selectedApp
              ? notifications.filter(n => (n.packageName || n.appName) === selectedApp).length
              : totalCount) ? (
              <View style={styles.loadMore}>
                <Text style={[styles.loadMoreText, { color: colors.mutedForeground }]}>
                  Daha fazla yüklemek için kaydırın...
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Detail Modal */}
      <NotificationDetail
        notification={selectedNotif}
        onClose={() => setSelectedNotif(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingTop: 8,
  },
  loadMore: {
    alignItems: "center",
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 12,
  },
});
