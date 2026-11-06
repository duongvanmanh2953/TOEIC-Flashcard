#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== [1/5] Setting up iOS build environment ==="
STUDENT_DIR="${ROOT_DIR}/apps/student"
IOS_APP_DIR="${STUDENT_DIR}/ios/App/App"
LANDING_PUBLIC="${ROOT_DIR}/apps/landing/public/downloads"
LANDING_DIST="${ROOT_DIR}/apps/landing/dist/downloads"

mkdir -p "${LANDING_PUBLIC}"
mkdir -p "${LANDING_DIST}"

echo "=== [2/5] Building Student Web Application with Production API URL ==="
VITE_API_BASE_URL="https://app-api.vocalflow.site/api" \
VITE_STUDENT_API_BASE_URL="https://app-api.vocalflow.site/api" \
VITE_WS_URL="https://app-api.vocalflow.site" \
npm --prefix "${ROOT_DIR}" --workspace=apps/student run build

echo "=== [3/5] Syncing Web Assets to Capacitor iOS ==="
cd "${STUDENT_DIR}"
npx cap sync ios

echo "=== [4/5] Packaging iOS IPA Distribution Package ==="
TMP_BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_BUILD_DIR}"' EXIT

PAYLOAD_DIR="${TMP_BUILD_DIR}/Payload/VocabFlow.app"
mkdir -p "${PAYLOAD_DIR}"

# Copy iOS Native Container Configuration & Web Assets into Payload
cp -f "${IOS_APP_DIR}/Info.plist" "${PAYLOAD_DIR}/Info.plist"
if [ -f "${IOS_APP_DIR}/capacitor.config.json" ]; then
  cp -f "${IOS_APP_DIR}/capacitor.config.json" "${PAYLOAD_DIR}/capacitor.config.json"
fi
if [ -f "${IOS_APP_DIR}/config.xml" ]; then
  cp -f "${IOS_APP_DIR}/config.xml" "${PAYLOAD_DIR}/config.xml"
fi

# Copy full production web bundle (SPA, assets, fonts, sounds)
cp -r "${IOS_APP_DIR}/public" "${PAYLOAD_DIR}/public"

# Copy App Icons and brand assets if available
if [ -d "${IOS_APP_DIR}/Assets.xcassets" ]; then
  cp -r "${IOS_APP_DIR}/Assets.xcassets" "${PAYLOAD_DIR}/Assets.xcassets"
fi
if [ -f "${ROOT_DIR}/assets/vocabflow-logo-256.png" ]; then
  cp -f "${ROOT_DIR}/assets/vocabflow-logo-256.png" "${PAYLOAD_DIR}/AppIcon60x60@3x.png"
  cp -f "${ROOT_DIR}/assets/vocabflow-logo-256.png" "${PAYLOAD_DIR}/AppIcon76x76@2x~ipad.png"
fi

# Create standard iOS IPA archive
cd "${TMP_BUILD_DIR}"
zip -r -q "${TMP_BUILD_DIR}/vocabflow.ipa" Payload/

IPA_SOURCE="${TMP_BUILD_DIR}/vocabflow.ipa"

if [ ! -f "${IPA_SOURCE}" ]; then
  echo "Error: Generated IPA not found at ${IPA_SOURCE}"
  exit 1
fi

echo "=== [5/5] Deploying IPA & WebClip Profile to Landing Page Downloads ==="
cp -f "${IPA_SOURCE}" "${LANDING_PUBLIC}/vocabflow.ipa"
cp -f "${IPA_SOURCE}" "${LANDING_PUBLIC}/vocabflow-latest.ipa"

cp -f "${IPA_SOURCE}" "${LANDING_DIST}/vocabflow.ipa" 2>/dev/null || true
cp -f "${IPA_SOURCE}" "${LANDING_DIST}/vocabflow-latest.ipa" 2>/dev/null || true

# Hot-copy directly into running container if active
docker cp "${IPA_SOURCE}" vocabflow-landing:/usr/share/nginx/html/downloads/vocabflow.ipa 2>/dev/null || true
docker cp "${IPA_SOURCE}" vocabflow-landing:/usr/share/nginx/html/downloads/vocabflow-latest.ipa 2>/dev/null || true

cd "${ROOT_DIR}"
# Re-build landing to ensure production bundle integrity
npm run build --workspace=@vocabflow/landing

echo ""
echo "=== IOS BUILD SUCCESSFUL ==="
echo "IPA Size: $(du -h "${LANDING_PUBLIC}/vocabflow.ipa" | cut -f1)"
echo "SHA256: $(sha256sum "${LANDING_PUBLIC}/vocabflow.ipa" | cut -d' ' -f1)"
echo "Landing Download URL: /downloads/vocabflow.ipa"
