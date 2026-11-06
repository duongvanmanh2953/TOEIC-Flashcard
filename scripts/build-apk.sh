#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== [1/5] Setting up Android build environment ==="
export ANDROID_HOME="${ANDROID_HOME:-/home/duong/Android/Sdk}"
export PATH="${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${PATH}"
echo "Using ANDROID_HOME: ${ANDROID_HOME}"

echo "=== [1.5/5] Generating Android Launcher Icons and Brand Assets ==="
python3 "${ROOT_DIR}/scripts/generate-android-assets.py"

echo "=== [2/5] Building Student Web Application with Production API URL ==="
VITE_API_BASE_URL="https://app-api.vocalflow.site/api" \
VITE_STUDENT_API_BASE_URL="https://app-api.vocalflow.site/api" \
VITE_WS_URL="https://app-api.vocalflow.site" \
npm --prefix "${ROOT_DIR}" --workspace=apps/student run build

echo "=== [3/5] Syncing Web Assets to Capacitor Android ==="
cd "${ROOT_DIR}/apps/student"
npx cap sync android

echo "=== [4/5] Building Android APK (assembleDebug) ==="
cd "${ROOT_DIR}/apps/student/android"
./gradlew assembleDebug

APK_SOURCE="${ROOT_DIR}/apps/student/android/app/build/outputs/apk/debug/app-debug.apk"
LANDING_PUBLIC="${ROOT_DIR}/apps/landing/public/downloads"
LANDING_DIST="${ROOT_DIR}/apps/landing/dist/downloads"

if [ ! -f "${APK_SOURCE}" ]; then
  echo "Error: Generated APK not found at ${APK_SOURCE}"
  exit 1
fi

echo "=== [5/5] Deploying APK to Landing Page Downloads ==="
mkdir -p "${LANDING_PUBLIC}"
cp -f "${APK_SOURCE}" "${LANDING_PUBLIC}/vocabflow.apk"
cp -f "${APK_SOURCE}" "${LANDING_PUBLIC}/vocabflow-latest.apk"

mkdir -p "${LANDING_DIST}"
cp -f "${APK_SOURCE}" "${LANDING_DIST}/vocabflow.apk"
cp -f "${APK_SOURCE}" "${LANDING_DIST}/vocabflow-latest.apk"

cd "${ROOT_DIR}"
# Re-build landing to ensure production bundle integrity
npm run build --workspace=@vocabflow/landing

echo ""
echo "=== BUILD SUCCESSFUL ==="
echo "APK Size: $(du -h "${LANDING_PUBLIC}/vocabflow.apk" | cut -f1)"
echo "SHA256: $(sha256sum "${LANDING_PUBLIC}/vocabflow.apk" | cut -d' ' -f1)"
echo "Landing Download URL: /downloads/vocabflow.apk"
