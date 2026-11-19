#!/usr/bin/env bash

# ==============================================================================
# Script: build.sh
# Mo ta: Ho tro build he thong Web/Docker va/hoac Android Mobile App (Capacitor)
# ==============================================================================

# Tu dong chuyen sang bash neu nguoi dung chay bang 'sh build.sh' (dash tren Ubuntu/Debian)
if [ -z "$BASH_VERSION" ] && command -v bash > /dev/null 2>&1; then
    exec bash "$0" "$@"
fi

set -e

# Dinh nghia mau sac hien thi
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Chuyen den thu muc goc cua du an
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

show_help() {
    printf "${CYAN}${BOLD}VOCABFLOW AI - BUILD SYSTEM${NC}\n"
    printf "Cach su dung: ./build.sh [OPTIONS]\n\n"
    printf "Tuy chon muc tieu build (Target):\n"
    printf "  --web          Chi build Web & He thong Docker (Full-stack 8 services + DB)\n"
    printf "  --app, --android\n"
    printf "                 Chi build Android Mobile App (.apk qua Capacitor + Gradle)\n"
    printf "  --all, --both  Build ca hai: Web/Docker va Android Mobile App\n\n"
    printf "Tuy chon bo sung:\n"
    printf "  --release      Build Android APK che do Release (mac dinh la Debug)\n"
    printf "  --skip-pull    Bo qua buoc git pull (giu nguyen code hien tai)\n"
    printf "  --no-cache     Build docker image khong su dung cache\n"
    printf "  -h, --help     Hien thi huong dan nay\n\n"
    printf "Ghi chu: Neu khong truyen cờ, script se hien thi menu de ban tu chon truc tiep.\n"
}

# 1. Xu ly cac tham so dong lenh
TARGET_MODE=""
SKIP_PULL=false
NO_CACHE=""
BUILD_RELEASE=false

for arg in "$@"; do
    case $arg in
        --web)
            TARGET_MODE="web"
            ;;
        --app|--android)
            TARGET_MODE="android"
            ;;
        --all|--both)
            TARGET_MODE="all"
            ;;
        --release)
            BUILD_RELEASE=true
            ;;
        --skip-pull)
            SKIP_PULL=true
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            printf "${YELLOW}[CANH BAO] Tham so khong nhan dien: %s${NC}\n" "$arg"
            ;;
    esac
done

printf "${CYAN}${BOLD}=====================================================${NC}\n"
printf "${CYAN}${BOLD}   VOCABFLOW AI - UNIFIED BUILD & DEPLOY SYSTEM      ${NC}\n"
printf "${CYAN}${BOLD}=====================================================${NC}\n\n"

# 2. Hien thi menu chon lua neu chua chi dinh qua co dong lenh
if [ -z "$TARGET_MODE" ]; then
    if [ -t 0 ]; then
        printf "${BOLD}Chon thanh phan ban muon build:${NC}\n"
        printf "  ${BOLD}1)${NC} Web & He thong Docker (Full-stack API + Web + Admin + Kids) ${CYAN}[Mac dinh]${NC}\n"
        printf "  ${BOLD}2)${NC} Android Mobile App (Capacitor + Gradle APK)\n"
        printf "  ${BOLD}3)${NC} Ca hai (Web & Docker + Android App)\n"
        printf "  ${BOLD}4)${NC} Thoat\n\n"
        read -r -p "Nhap lua chon cua ban [1-4] (Nhan Enter mac dinh la 1): " USER_CHOICE
        case "$USER_CHOICE" in
            2)
                TARGET_MODE="android"
                ;;
            3)
                TARGET_MODE="all"
                ;;
            4)
                printf "${YELLOW}Da huy thao tac.${NC}\n"
                exit 0
                ;;
            1|*)
                TARGET_MODE="web"
                ;;
        esac
        printf "\n"
    else
        TARGET_MODE="web"
    fi
fi

BUILD_WEB=false
BUILD_ANDROID=false

case "$TARGET_MODE" in
    android)
        BUILD_ANDROID=true
        printf "${BLUE}>>> Che do duoc chon: ${BOLD}Build Android Mobile App${NC}\n\n"
        ;;
    all)
        BUILD_WEB=true
        BUILD_ANDROID=true
        printf "${BLUE}>>> Che do duoc chon: ${BOLD}Build ca Web/Docker va Android Mobile App${NC}\n\n"
        ;;
    web|*)
        BUILD_WEB=true
        printf "${BLUE}>>> Che do duoc chon: ${BOLD}Build Web & He thong Docker${NC}\n\n"
        ;;
esac

# 3. Git Pull tu branch hien tai (neu khong bi skip)
if [ "$SKIP_PULL" = true ]; then
    printf "${YELLOW}[Git] Bo qua git pull theo yeu cau (--skip-pull)...${NC}\n"
else
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

    if [ -z "$CURRENT_BRANCH" ] || [ "$CURRENT_BRANCH" = "HEAD" ]; then
        printf "${YELLOW}[Git] Detached HEAD hoac khong xac dinh duoc branch. Bo qua git pull...${NC}\n"
    else
        printf "${BLUE}[Git] Dong bo ma nguon moi nhat tu branch '%s'...${NC}\n" "$CURRENT_BRANCH"
        if git pull origin "$CURRENT_BRANCH"; then
            printf "${GREEN}✓ Dong bo code tu origin/%s thanh cong!${NC}\n" "$CURRENT_BRANCH"
        else
            printf "${YELLOW}[!] Git pull gap su co (co the do offline hoac conflict), tiep tuc voi ma nguon hien tai.${NC}\n"
        fi
    fi
fi

# ==============================================================================
# PHAN A: BUILD WEB & HE THONG DOCKER
# ==============================================================================
build_web_docker() {
    printf "\n${CYAN}${BOLD}-----------------------------------------------------${NC}\n"
    printf "${CYAN}${BOLD}   [1] KHOI CHAY BUILD WEB & HE THONG DOCKER         ${NC}\n"
    printf "${CYAN}${BOLD}-----------------------------------------------------${NC}\n"

    # Kiem tra Docker
    if ! command -v docker > /dev/null 2>&1; then
        printf "${RED}[ERROR] Docker chua duoc cai dat hoac chua co trong PATH!${NC}\n"
        return 1
    fi

    if ! docker info > /dev/null 2>&1; then
        printf "${RED}[ERROR] Docker daemon chua khoi dong hoac user hien tai khong co quyen docker!${NC}\n"
        return 1
    fi

    if docker compose version > /dev/null 2>&1; then
        DOCKER_COMPOSE="docker compose"
    elif command -v docker-compose > /dev/null 2>&1; then
        DOCKER_COMPOSE="docker-compose"
    else
        printf "${RED}[ERROR] Khong tim thay 'docker compose' hoac 'docker-compose'.${NC}\n"
        return 1
    fi
    printf "${GREEN}✓ Docker dang hoat dong (${DOCKER_COMPOSE})${NC}\n"

    # Kiem tra .env
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            printf "${YELLOW}[!] Dang tao moi file .env tu .env.example...${NC}\n"
            cp .env.example .env
            printf "${GREEN}✓ Da tao file .env.${NC}\n"
        fi
    else
        printf "${GREEN}✓ File .env da san sang.${NC}\n"
    fi

    # Don dep container cloudflared ton dong neu co
    docker rm -f cloudflared >/dev/null 2>&1 || true

    printf "Dang chay: ${BOLD}%s up -d --build --remove-orphans${NC}\n" "$DOCKER_COMPOSE"
    if [ -n "$NO_CACHE" ]; then
        $DOCKER_COMPOSE build --no-cache
    fi

    if ! $DOCKER_COMPOSE up -d --build --remove-orphans; then
        printf "\n${RED}[ERROR] Build hoac khoi dong Docker container that bai!${NC}\n"
        return 1
    fi

    sleep 3
    $DOCKER_COMPOSE ps

    printf "\n${GREEN}${BOLD}================================================================${NC}\n"
    printf "${GREEN}${BOLD}   VOCABFLOW MODULAR ARCHITECTURE (8 SERVICES) IS RUNNING!    ${NC}\n"
    printf "${GREEN}${BOLD}================================================================${NC}\n\n"
    printf "  ${BOLD}1. Landing & Redirect:${NC}  ${CYAN}http://localhost:3080${NC} -> vocalflow.site\n"
    printf "  ${BOLD}2. Student Frontend:${NC}    ${CYAN}http://localhost:3000${NC} -> app.vocalflow.site\n"
    printf "  ${BOLD}3. Student API:${NC}         ${CYAN}http://localhost:4000${NC} -> app-api.vocalflow.site\n"
    printf "  ${BOLD}4. Kid Frontend:${NC}        ${CYAN}http://localhost:3100${NC} -> kid.vocalflow.site\n"
    printf "  ${BOLD}5. Kid API:${NC}             ${CYAN}http://localhost:4100${NC} -> kid-api.vocalflow.site\n"
    printf "  ${BOLD}6. Admin Frontend:${NC}      ${CYAN}http://localhost:3200${NC} -> admin.vocalflow.site\n"
    printf "  ${BOLD}7. Admin API:${NC}          ${CYAN}http://localhost:4200${NC} -> admin-api.vocalflow.site\n"
    printf "  ${BOLD}8. Assets Service:${NC}      ${CYAN}http://localhost:3300${NC} -> assets.vocalflow.site\n\n"
    printf "  ${BOLD}Database & Cache (Private to 127.0.0.1):${NC}\n"
    printf "    - PostgreSQL: ${YELLOW}127.0.0.1:5432${NC}\n"
    printf "    - Redis:      ${YELLOW}127.0.0.1:6379${NC}\n\n"
    printf "  ${BOLD}Tai khoan mac dinh:${NC}\n"
    printf "    - Learner: ${YELLOW}learner@vocabflow.ai${NC} / ${YELLOW}password123${NC}\n"
    printf "    - Admin:   ${YELLOW}admin@vocabflow.ai${NC}   / ${YELLOW}admin123${NC}\n"
    printf "${CYAN}----------------------------------------------------------------${NC}\n"
}

# ==============================================================================
# PHAN B: BUILD ANDROID MOBILE APP (CAPACITOR + GRADLE)
# ==============================================================================
build_android_app() {
    printf "\n${CYAN}${BOLD}-----------------------------------------------------${NC}\n"
    printf "${CYAN}${BOLD}   [2] KHOI CHAY BUILD ANDROID MOBILE APP (APK)      ${NC}\n"
    printf "${CYAN}${BOLD}-----------------------------------------------------${NC}\n"

    # 1. Kiem tra Java
    if ! command -v java > /dev/null 2>&1; then
        printf "${RED}[ERROR] Khong tim thay Java JDK. Vui long cai dat Java 17+ hoac 21!${NC}\n"
        return 1
    fi
    JAVA_VER=$(java -version 2>&1 | head -n 1)
    printf "${GREEN}✓ Java san sang: %s${NC}\n" "$JAVA_VER"

    # 2. Xac dinh Android SDK
    if [ -z "$ANDROID_HOME" ] && [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    fi

    if [ -n "$ANDROID_HOME" ] && [ -d "$ANDROID_HOME" ]; then
        printf "${GREEN}✓ Android SDK: %s${NC}\n" "$ANDROID_HOME"
    else
        printf "${YELLOW}[!] Khong tim thay ANDROID_HOME. Gradle se dung cau hinh tai local.properties neu co.${NC}\n"
    fi

    # 3. Build Web Bundle cho Student App
    printf "${BLUE}[Android 1/3] Bien dich goi web (@vocabflow/student) voi Production API URL...${NC}\n"
    VITE_API_BASE_URL="https://app-api.vocalflow.site/api" \
    VITE_STUDENT_API_BASE_URL="https://app-api.vocalflow.site/api" \
    VITE_WS_URL="https://app-api.vocalflow.site" \
    npm --prefix apps/student run build

    # 4. Sync sang Android qua Capacitor
    printf "${BLUE}[Android 2/3] Dong bo Web Assets vao Android (npx cap sync android)...${NC}\n"
    (cd apps/student && npx cap sync android)

    # 5. Build APK bang Gradle Wrapper
    printf "${BLUE}[Android 3/3] Bien dich APK bang Gradle Wrapper...${NC}\n"
    GRADLE_TASK="assembleDebug"
    if [ "$BUILD_RELEASE" = true ]; then
        GRADLE_TASK="assembleRelease"
        printf "${YELLOW}Che do bien dich: Release (%s)${NC}\n" "$GRADLE_TASK"
    else
        printf "${CYAN}Che do bien dich: Debug (%s)${NC}\n" "$GRADLE_TASK"
    fi

    (cd apps/student/android && chmod +x gradlew && ./gradlew "$GRADLE_TASK")

    # Tim file APK vua build
    APK_OUTPUT_DIR="$SCRIPT_DIR/apps/student/android/app/build/outputs/apk"
    FOUND_APK=""
    if [ "$BUILD_RELEASE" = true ]; then
        if [ -f "$APK_OUTPUT_DIR/release/app-release.apk" ]; then
            FOUND_APK="$APK_OUTPUT_DIR/release/app-release.apk"
        elif [ -f "$APK_OUTPUT_DIR/release/app-release-unsigned.apk" ]; then
            FOUND_APK="$APK_OUTPUT_DIR/release/app-release-unsigned.apk"
        fi
    else
        if [ -f "$APK_OUTPUT_DIR/debug/app-debug.apk" ]; then
            FOUND_APK="$APK_OUTPUT_DIR/debug/app-debug.apk"
        fi
    fi

    if [ -z "$FOUND_APK" ]; then
        FOUND_APK=$(find "$APK_OUTPUT_DIR" -name "*.apk" 2>/dev/null | head -n 1)
    fi

    if [ -n "$FOUND_APK" ] && [ -f "$FOUND_APK" ]; then
        APK_SIZE=$(ls -lh "$FOUND_APK" | awk '{print $5}')

        # Dong bo APK ra Landing Page va Container Docker dang chay
        LANDING_PUBLIC="$SCRIPT_DIR/apps/landing/public/downloads"
        LANDING_DIST="$SCRIPT_DIR/apps/landing/dist/downloads"

        mkdir -p "$LANDING_PUBLIC" "$LANDING_DIST"
        cp -f "$FOUND_APK" "$LANDING_PUBLIC/vocabflow.apk"
        cp -f "$FOUND_APK" "$LANDING_PUBLIC/vocabflow-latest.apk"
        cp -f "$FOUND_APK" "$LANDING_DIST/vocabflow.apk"
        cp -f "$FOUND_APK" "$LANDING_DIST/vocabflow-latest.apk"

        # Hot-copy truc tiep vao running container neu co
        docker cp "$FOUND_APK" vocabflow-landing:/usr/share/nginx/html/downloads/vocabflow.apk 2>/dev/null || true
        docker cp "$FOUND_APK" vocabflow-landing:/usr/share/nginx/html/downloads/vocabflow-latest.apk 2>/dev/null || true

        printf "\n${GREEN}${BOLD}================================================================${NC}\n"
        printf "${GREEN}${BOLD}   ✓ BUILD ANDROID APP THANH CONG!                              ${NC}\n"
        printf "${GREEN}${BOLD}================================================================${NC}\n"
        printf "  ${BOLD}Duong dan APK:${NC}  ${CYAN}%s${NC}\n" "$FOUND_APK"
        printf "  ${BOLD}Dung luong:${NC}     ${YELLOW}%s${NC}\n" "$APK_SIZE"
        printf "  ${BOLD}Landing Download:${NC} ${CYAN}%s/vocabflow.apk${NC}\n" "$LANDING_PUBLIC"
        printf "  ${BOLD}Cai dat ngay:${NC}   ${BOLD}adb install -r \"%s\"${NC}\n" "$FOUND_APK"
        printf "${GREEN}----------------------------------------------------------------${NC}\n"
    else
        printf "${RED}[ERROR] Build Gradle hoan tat nhung khong tim thay file .apk tai %s${NC}\n" "$APK_OUTPUT_DIR"
        return 1
    fi
}

# ==============================================================================
# DIEU PHOI THUC THI
# ==============================================================================
if [ "$BUILD_WEB" = true ]; then
    build_web_docker
fi

if [ "$BUILD_ANDROID" = true ]; then
    build_android_app
fi

printf "\n${GREEN}${BOLD}>>> HOAN TAT TAT CA TIEN TRINH BUILD THEO YEU CAU! <<<${NC}\n\n"
