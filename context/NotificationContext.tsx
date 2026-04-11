import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus, NativeEventEmitter, NativeModules, Platform } from "react-native";
import { SavedNotification } from "@/types/notification";

const STORAGE_KEY = "@bildirim_kaydedici_notifications";
const MAX_NOTIFICATIONS = 500;

interface NotificationContextType {
  notifications: SavedNotification[];
  isListening: boolean;
  hasPermission: boolean;
  totalCount: number;
  addNotification: (notif: SavedNotification) => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  requestPermission: () => void;
  loadMore: () => void;
  displayedCount: number;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const PAGE_SIZE = 50;

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const DEMO_NOTIFICATIONS: Omit<SavedNotification, "id" | "receivedAt">[] = [
  {
    appName: "WhatsApp",
    packageName: "com.whatsapp",
    title: "Ahmet Yılmaz",
    text: "Merhaba, yarın buluşabilir miyiz?",
    subText: "WhatsApp",
    bigText: "Merhaba, yarın buluşabilir miyiz? Saat 15:00 uygun mu?",
    ticker: "Ahmet Yılmaz: Merhaba",
    timestamp: Date.now() - 120000,
    postTime: new Date(Date.now() - 120000).toISOString(),
    category: "msg",
    priority: 1,
    isOngoing: false,
    isGroupSummary: false,
    groupKey: "whatsapp:msg",
    sortKey: "",
    tag: "1234",
    number: 1,
    visibility: 0,
    actions: ["Yanıtla", "Sessize al"],
    extras: { "android.people.list": "Ahmet Yılmaz" },
    iconColor: "#25D366",
  },
  {
    appName: "Gmail",
    packageName: "com.google.android.gm",
    title: "Yeni mesaj: Fatura Ocak 2026",
    text: "Faturanız hazır. Toplam tutar: 450 TL",
    subText: "ornek@gmail.com",
    bigText: "Faturanız hazırlandı. Toplam tutar: 450 TL. Son ödeme tarihi: 15 Ocak 2026.",
    ticker: "Yeni mail: Fatura",
    timestamp: Date.now() - 600000,
    postTime: new Date(Date.now() - 600000).toISOString(),
    category: "email",
    priority: 0,
    isOngoing: false,
    isGroupSummary: false,
    groupKey: "gmail:inbox",
    sortKey: "",
    tag: "",
    number: 3,
    visibility: -1,
    actions: ["Arşivle", "Yanıtla"],
    extras: {},
    iconColor: "#EA4335",
  },
  {
    appName: "Instagram",
    packageName: "com.instagram.android",
    title: "merve_kaya fotoğrafınızı beğendi",
    text: "merve_kaya, son fotoğrafınızı beğendi.",
    subText: "",
    bigText: "",
    ticker: "merve_kaya fotoğrafınızı beğendi",
    timestamp: Date.now() - 1800000,
    postTime: new Date(Date.now() - 1800000).toISOString(),
    category: "social",
    priority: 0,
    isOngoing: false,
    isGroupSummary: false,
    groupKey: "",
    sortKey: "",
    tag: "",
    number: 5,
    visibility: 0,
    actions: [],
    extras: {},
    iconColor: "#E1306C",
  },
  {
    appName: "Hava Durumu",
    packageName: "com.google.android.googlequicksearchbox",
    title: "İstanbul Hava Durumu",
    text: "Bugün bulutlu, 12°C. Hafif yağmur bekleniyor.",
    subText: "İstanbul",
    bigText: "Bugün bulutlu, 12°C. Öğleden sonra hafif yağmur bekleniyor. Rüzgar: 15 km/s GB.",
    ticker: "",
    timestamp: Date.now() - 3600000,
    postTime: new Date(Date.now() - 3600000).toISOString(),
    category: "weather",
    priority: -1,
    isOngoing: false,
    isGroupSummary: false,
    groupKey: "",
    sortKey: "",
    tag: "",
    number: 0,
    visibility: 1,
    actions: [],
    extras: {},
    iconColor: "#4285F4",
  },
  {
    appName: "Spotify",
    packageName: "com.spotify.music",
    title: "Şimdi çalıyor",
    text: "Duman - Seni Kendime Sakladım",
    subText: "Spotify Premium",
    bigText: "",
    ticker: "Duman - Seni Kendime Sakladım",
    timestamp: Date.now() - 300000,
    postTime: new Date(Date.now() - 300000).toISOString(),
    category: "transport",
    priority: -2,
    isOngoing: true,
    isGroupSummary: false,
    groupKey: "",
    sortKey: "",
    tag: "player",
    number: 0,
    visibility: 1,
    actions: ["Önceki", "Duraklat", "Sonraki"],
    extras: { "android.mediaSession.playbackState": "3" },
    iconColor: "#1DB954",
  },
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<SavedNotification[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    loadStoredNotifications();
    checkPermission();

    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        checkPermission();
      }
      appStateRef.current = nextState;
    });

    return () => {
      appStateSub.remove();
    };
  }, []);

  const loadStoredNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SavedNotification[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setNotifications(parsed);
          return;
        }
      }
      if (Platform.OS === "web") {
        const demoNotifs: SavedNotification[] = DEMO_NOTIFICATIONS.map((n) => ({
          ...n,
          id: makeId(),
          receivedAt: new Date(n.timestamp).toISOString(),
        }));
        setNotifications(demoNotifs);
        setHasPermission(true);
        setIsListening(true);
      }
    } catch (e) {
      console.error("Bildirimler yüklenemedi:", e);
    }
  };

  const saveNotifications = async (notifs: SavedNotification[]) => {
    try {
      const toSave = notifs.slice(0, MAX_NOTIFICATIONS);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Bildirimler kaydedilemedi:", e);
    }
  };

  const checkPermission = async () => {
    if (Platform.OS === "web") {
      setHasPermission(true);
      setIsListening(true);
      return;
    }
    const { RNNotificationListener } = NativeModules;
    if (!RNNotificationListener) {
      setHasPermission(false);
      setIsListening(false);
      return;
    }
    try {
      const granted: boolean = await RNNotificationListener.isNotificationAccessGranted();
      setHasPermission(granted);
      setIsListening(granted);
    } catch {
      setHasPermission(false);
      setIsListening(false);
    }
  };

  const requestPermission = useCallback(() => {
    if (Platform.OS === "web") return;
    const { RNNotificationListener } = NativeModules;
    if (RNNotificationListener) {
      RNNotificationListener.openNotificationAccessSettings();
    }
  }, []);

  const addNotification = useCallback((notif: SavedNotification) => {
    setNotifications((prev) => {
      const updated = [notif, ...prev];
      const trimmed = updated.slice(0, MAX_NOTIFICATIONS);
      saveNotifications(trimmed);
      return trimmed;
    });
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const loadMore = useCallback(() => {
    setDisplayedCount((prev) => Math.min(prev + PAGE_SIZE, notifications.length));
  }, [notifications.length]);

  useEffect(() => {
    if (Platform.OS === "web" || !hasPermission) return;
    const { RNNotificationListener } = NativeModules;
    if (!RNNotificationListener) return;

    const emitter = new NativeEventEmitter(RNNotificationListener);
    const sub = emitter.addListener("onNotificationReceived", (raw: any) => {
      const now = new Date();
      const notif: SavedNotification = {
        id: makeId(),
        appName: raw.appName ?? "Bilinmiyor",
        packageName: raw.packageName ?? "",
        title: raw.title ?? "",
        text: raw.text ?? "",
        subText: raw.subText ?? "",
        bigText: raw.bigText ?? "",
        ticker: raw.ticker ?? "",
        timestamp: raw.timestamp ?? Date.now(),
        postTime: raw.postTime ?? now.toISOString(),
        category: raw.category ?? "",
        priority: raw.priority ?? 0,
        isOngoing: raw.isOngoing ?? false,
        isGroupSummary: raw.isGroupSummary ?? false,
        groupKey: raw.groupKey ?? "",
        sortKey: raw.sortKey ?? "",
        tag: raw.tag ?? "",
        number: raw.number ?? 0,
        visibility: raw.visibility ?? 0,
        actions: raw.actions ?? [],
        extras: raw.extras ?? {},
        iconColor: raw.iconColor ?? null,
        receivedAt: now.toISOString(),
      };
      addNotification(notif);
    });

    return () => sub.remove();
  }, [hasPermission, addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        isListening,
        hasPermission,
        totalCount: notifications.length,
        addNotification,
        deleteNotification,
        clearAll,
        requestPermission,
        loadMore,
        displayedCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
