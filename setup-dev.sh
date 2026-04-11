#!/usr/bin/env bash
# ============================================================
# Bildirim Kaydedici – Android Geliştirme Ortamı Kurulum
# Linux / macOS için
# Kullanım: chmod +x setup-dev.sh && ./setup-dev.sh
# ============================================================
set -e

ANDROID_SDK_ROOT="$HOME/android-sdk"
CMDLINE_TOOLS_VERSION="11076708"   # 2025 Q1 – gerekirse güncelle
JAVA_MIN=17
BUILD_TOOLS="35.0.0"
PLATFORM_API="35"
NODE_MIN=18

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✔ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
fail() { echo -e "${RED}✘ $1${NC}"; exit 1; }
info() { echo -e "  $1"; }

echo ""
echo "====================================================="
echo "  Bildirim Kaydedici – Android Kurulum Scripti"
echo "====================================================="
echo ""

# ── 1. İşletim Sistemi ─────────────────────────────────────
OS="$(uname -s)"
ARCH="$(uname -m)"
case "$OS" in
  Linux)  PLATFORM="linux"  ;;
  Darwin) PLATFORM="mac"    ;;
  *)      fail "Desteklenmeyen işletim sistemi: $OS" ;;
esac
ok "Platform: $OS ($ARCH)"

# ── 2. Node.js kontrolü ────────────────────────────────────
if command -v node &>/dev/null; then
  NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
  if [ "$NODE_VER" -ge "$NODE_MIN" ]; then
    ok "Node.js $NODE_VER bulundu"
  else
    warn "Node.js $NODE_VER eski. v${NODE_MIN}+ gerekli."
    info "→ https://nodejs.org adresinden güncelleyin"
    exit 1
  fi
else
  fail "Node.js bulunamadı. https://nodejs.org adresinden kurun."
fi

# ── 3. Java 17+ kontrolü / kurulumu ───────────────────────
install_java() {
  info "Java 17 kuruluyor..."
  if [ "$PLATFORM" = "linux" ]; then
    if command -v apt-get &>/dev/null; then
      sudo apt-get update -q && sudo apt-get install -y openjdk-17-jdk
    elif command -v dnf &>/dev/null; then
      sudo dnf install -y java-17-openjdk-devel
    elif command -v pacman &>/dev/null; then
      sudo pacman -Sy --noconfirm jdk17-openjdk
    else
      fail "Paket yöneticisi bulunamadı. Java 17'yi elle kurun: https://adoptium.net"
    fi
  elif [ "$PLATFORM" = "mac" ]; then
    if command -v brew &>/dev/null; then
      brew install --cask temurin@17
    else
      fail "Homebrew bulunamadı. https://brew.sh kurun veya https://adoptium.net'ten Java indirin."
    fi
  fi
}

JAVA_HOME_FOUND=""
if command -v java &>/dev/null; then
  JAVA_VER=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d. -f1)
  [ -z "$JAVA_VER" ] && JAVA_VER=$(java -version 2>&1 | grep -oP '(?<=version ")[0-9]+' | head -1)
  if [ "$JAVA_VER" -ge "$JAVA_MIN" ] 2>/dev/null; then
    ok "Java $JAVA_VER bulundu"
    JAVA_HOME_FOUND="$(java -XshowSettings:property -version 2>&1 | grep 'java.home' | awk '{print $NF}')"
  else
    warn "Java $JAVA_VER eski. Java 17 kuruluyor..."
    install_java
  fi
else
  warn "Java bulunamadı. Kuruluyor..."
  install_java
fi

# JAVA_HOME bul
if [ -z "$JAVA_HOME" ]; then
  if [ "$PLATFORM" = "linux" ]; then
    JAVA_HOME_FOUND=$(update-java-alternatives -l 2>/dev/null | grep "17\|21" | head -1 | awk '{print $3}')
    [ -z "$JAVA_HOME_FOUND" ] && JAVA_HOME_FOUND=$(dirname $(dirname $(readlink -f $(which java))))
  elif [ "$PLATFORM" = "mac" ]; then
    JAVA_HOME_FOUND=$(/usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home 2>/dev/null)
  fi
fi

# ── 4. Android SDK kurulumu ────────────────────────────────
if [ -d "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin" ]; then
  ok "Android SDK zaten kurulu: $ANDROID_SDK_ROOT"
else
  info "Android cmdline-tools indiriliyor..."
  mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"

  if [ "$PLATFORM" = "linux" ]; then
    ZIP_FILE="commandlinetools-linux-${CMDLINE_TOOLS_VERSION}_latest.zip"
  else
    ZIP_FILE="commandlinetools-mac-${CMDLINE_TOOLS_VERSION}_latest.zip"
  fi

  DOWNLOAD_URL="https://dl.google.com/android/repository/${ZIP_FILE}"
  info "URL: $DOWNLOAD_URL"

  TMP_ZIP="/tmp/android-cmdtools.zip"
  if command -v curl &>/dev/null; then
    curl -L --progress-bar -o "$TMP_ZIP" "$DOWNLOAD_URL"
  elif command -v wget &>/dev/null; then
    wget --show-progress -q -O "$TMP_ZIP" "$DOWNLOAD_URL"
  else
    fail "curl veya wget gerekli"
  fi

  unzip -q "$TMP_ZIP" -d "$ANDROID_SDK_ROOT/cmdline-tools/"
  mv "$ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools" "$ANDROID_SDK_ROOT/cmdline-tools/latest"
  rm "$TMP_ZIP"
  ok "Android cmdline-tools kuruldu"
fi

SDKMANAGER="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager"

# ── 5. SDK bileşenlerini kur ───────────────────────────────
info "SDK lisansları kabul ediliyor..."
yes | "$SDKMANAGER" --licenses > /dev/null 2>&1 || true

info "Platform tools, build-tools ve platform kuruluyor..."
"$SDKMANAGER" \
  "platform-tools" \
  "build-tools;${BUILD_TOOLS}" \
  "platforms;android-${PLATFORM_API}" \
  --sdk_root="$ANDROID_SDK_ROOT"
ok "Android SDK bileşenleri kuruldu"

# ── 6. Ortam değişkenleri ──────────────────────────────────
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
  SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  SHELL_RC="$HOME/.bashrc"
fi

EXPORTS="
# Android SDK
export ANDROID_HOME=\"$ANDROID_SDK_ROOT\"
export ANDROID_SDK_ROOT=\"$ANDROID_SDK_ROOT\"
export PATH=\"\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/cmdline-tools/latest/bin:\$PATH\""

if [ -n "$JAVA_HOME_FOUND" ]; then
  EXPORTS="${EXPORTS}
export JAVA_HOME=\"$JAVA_HOME_FOUND\""
fi

if [ -n "$SHELL_RC" ]; then
  if ! grep -q "ANDROID_HOME" "$SHELL_RC"; then
    echo "$EXPORTS" >> "$SHELL_RC"
    ok "Ortam değişkenleri $SHELL_RC dosyasına eklendi"
    info "→ Terminali yeniden başlatın veya: source $SHELL_RC"
  else
    ok "ANDROID_HOME zaten $SHELL_RC içinde tanımlı"
  fi
fi

# Bu oturum için geçici olarak ayarla
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export ANDROID_SDK_ROOT="$ANDROID_SDK_ROOT"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

# ── 7. Kurulum özeti ───────────────────────────────────────
echo ""
echo "====================================================="
echo "  Kurulum tamamlandı!"
echo "====================================================="
echo ""
echo "  ANDROID_HOME : $ANDROID_SDK_ROOT"
echo "  JAVA_HOME    : ${JAVA_HOME_FOUND:-$(which java)}"
echo ""
echo "  APK derlemek için:"
echo "    npm install"
echo "    npx expo prebuild -p android --clean"
echo "    cd android && ./gradlew assembleDebug"
echo ""
echo "  APK konumu:"
echo "    android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
