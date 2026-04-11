#!/usr/bin/env bash
# ============================================================
# Bildirim Kaydedici – APK Derleme Scripti
# Kullanım: chmod +x build-apk.sh && ./build-apk.sh
# Önce setup-dev.sh ile Android ortamını kurmuş olmanız gerekir.
# ============================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✔ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
fail() { echo -e "${RED}✘ $1${NC}"; exit 1; }

echo ""
echo "====================================================="
echo "  Bildirim Kaydedici – APK Derleme"
echo "====================================================="
echo ""

# ── Ön koşul kontrolleri ───────────────────────────────────
[ -z "$ANDROID_HOME" ] && fail "ANDROID_HOME ayarlanmamış. Önce setup-dev.sh çalıştırın."
[ -z "$(command -v node)" ] && fail "Node.js bulunamadı."
[ -z "$(command -v java)" ] && fail "Java bulunamadı."

ok "ANDROID_HOME: $ANDROID_HOME"
ok "Java: $(java -version 2>&1 | head -1)"
ok "Node: $(node --version)"

# ── npm install ────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo ""
  echo "→ Bağımlılıklar yükleniyor..."
  npm install --legacy-peer-deps
  ok "Bağımlılıklar yüklendi"
else
  ok "node_modules mevcut, atlanıyor"
fi

# ── Expo Prebuild ──────────────────────────────────────────
echo ""
echo "→ Expo prebuild çalıştırılıyor..."
npx expo prebuild -p android --clean
ok "Android projesi oluşturuldu"

# ── JAVA_HOME gradle.properties'e yaz ─────────────────────
if [ -n "$JAVA_HOME" ]; then
  JAVA_HOME_REAL="$JAVA_HOME"
else
  JAVA_HOME_REAL="$(java -XshowSettings:property -version 2>&1 | grep 'java.home' | awk '{print $NF}')"
fi

echo "org.gradle.java.home=$JAVA_HOME_REAL" >> android/gradle.properties
ok "Gradle Java home: $JAVA_HOME_REAL"

# ── Gradle build ──────────────────────────────────────────
echo ""
echo "→ APK derleniyor (bu birkaç dakika sürebilir)..."
cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon
cd ..

# ── Sonuç ─────────────────────────────────────────────────
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  APK_SIZE=$(du -sh "$APK_PATH" | cut -f1)
  echo ""
  echo "====================================================="
  ok "APK başarıyla oluşturuldu!"
  echo "====================================================="
  echo ""
  echo "  Dosya : $APK_PATH"
  echo "  Boyut : $APK_SIZE"
  echo ""
  echo "  Telefona yüklemek için:"
  echo "    adb install $APK_PATH"
  echo ""
  echo "  veya dosyayı telefona kopyalayıp Dosyalar uygulamasından kurun."
  echo "  (Ayarlar → Güvenlik → Bilinmeyen kaynaklardan kurulum → Aç)"
  echo ""
else
  fail "APK oluşturulamadı. Gradle logunu kontrol edin."
fi
