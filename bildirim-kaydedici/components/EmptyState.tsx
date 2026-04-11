import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  hasPermission: boolean;
  onRequestPermission: () => void;
  isFiltered?: boolean;
}

export default function EmptyState({ hasPermission, onRequestPermission, isFiltered }: Props) {
  const colors = useColors();

  if (isFiltered) {
    return (
      <View style={styles.container}>
        <Feather name="search" size={48} color={colors.mutedForeground} />
        <Text style={[styles.title, { color: colors.foreground }]}>Sonuç bulunamadı</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          Bu uygulama için kaydedilmiş bildirim yok.
        </Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
          <Feather name="bell-off" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Bildirim Erişimi Gerekli</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          Gelen bildirimleri kaydetmek için Bildirim Dinleme iznini etkinleştirmeniz gerekmektedir.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={onRequestPermission}
        >
          <Feather name="settings" size={16} color="#fff" />
          <Text style={styles.btnText}>İzni Etkinleştir</Text>
        </TouchableOpacity>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Ayarlar → Bildirim Erişimi → Bildirim Kaydedici
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
        <Feather name="bell" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>Henüz Bildirim Yok</Text>
      <Text style={[styles.desc, { color: colors.mutedForeground }]}>
        Telefonunuza gelen bildirimler burada otomatik olarak kaydedilecek.
        Şu anda dinleme aktif ve hazır.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
    gap: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  desc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
