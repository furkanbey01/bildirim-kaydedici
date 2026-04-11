import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SavedNotification } from "@/types/notification";
import { useColors } from "@/hooks/useColors";

interface Props {
  notification: SavedNotification | null;
  onClose: () => void;
}

function Row({ label, value, colors }: { label: string; value: string | number | boolean; colors: any }) {
  if (value === "" || value === null || value === undefined) return null;
  const displayValue = typeof value === "boolean" ? (value ? "Evet" : "Hayır") : String(value);
  if (!displayValue || displayValue === "0" || displayValue === "false") return null;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.foreground }]} selectable>
        {displayValue}
      </Text>
    </View>
  );
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
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

export default function NotificationDetail({ notification, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (!notification) return null;

  const priorityLabel = notification.priority > 0 ? "Yüksek" :
    notification.priority < 0 ? "Düşük" : "Normal";

  const visibilityLabel = notification.visibility === 1 ? "Herkese açık" :
    notification.visibility === -1 ? "Gizli" : "Özel";

  return (
    <Modal
      visible={!!notification}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, {
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 8,
          borderBottomColor: colors.border,
          backgroundColor: colors.card
        }]}>
          <Text style={[styles.topBarTitle, { color: colors.foreground }]}>Bildirim Detayı</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, {
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20
          }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Uygulama Bilgileri</Text>
            <Row label="Uygulama Adı" value={notification.appName} colors={colors} />
            <Row label="Paket Adı" value={notification.packageName} colors={colors} />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>İçerik</Text>
            <Row label="Başlık" value={notification.title} colors={colors} />
            <Row label="Metin" value={notification.text} colors={colors} />
            <Row label="Uzun Metin" value={notification.bigText} colors={colors} />
            <Row label="Alt Metin" value={notification.subText} colors={colors} />
            <Row label="Kaydırma Metni" value={notification.ticker} colors={colors} />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Zamanlama</Text>
            <Row label="Alındığı Zaman" value={formatTime(notification.receivedAt)} colors={colors} />
            <Row label="Gönderilme Zamanı" value={notification.postTime ? formatTime(notification.postTime) : ""} colors={colors} />
            <Row label="Unix Zaman Damgası" value={notification.timestamp} colors={colors} />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Özellikler</Text>
            <Row label="Kategori" value={notification.category} colors={colors} />
            <Row label="Öncelik" value={priorityLabel} colors={colors} />
            <Row label="Görünürlük" value={visibilityLabel} colors={colors} />
            <Row label="Devam Eden" value={notification.isOngoing} colors={colors} />
            <Row label="Grup Özeti" value={notification.isGroupSummary} colors={colors} />
            <Row label="Grup Anahtarı" value={notification.groupKey} colors={colors} />
            <Row label="Sıralama Anahtarı" value={notification.sortKey} colors={colors} />
            <Row label="Etiket" value={notification.tag} colors={colors} />
            <Row label="Sayı" value={notification.number > 0 ? notification.number : ""} colors={colors} />
          </View>

          {notification.actions.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Eylemler</Text>
              {notification.actions.map((action, i) => (
                <Row key={i} label={`Eylem ${i + 1}`} value={action} colors={colors} />
              ))}
            </View>
          )}

          {Object.keys(notification.extras).length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Ekstra Veriler</Text>
              {Object.entries(notification.extras).map(([key, val]) => (
                <Row key={key} label={key} value={val} colors={colors} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    bottom: 10,
    padding: 6,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "600",
    width: 130,
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
