#!/usr/bin/env bash

# ==============================================================================
# Script: build.sh
# Mo ta: Tu dong git pull tu branch hien tai, build va chay ngam he thong Docker
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

printf "${CYAN}${BOLD}=====================================================${NC}\n"
printf "${CYAN}${BOLD}   LETSTUN AI - PULL, BUILD & RUN DOCKER IN DAEMON  ${NC}\n"
printf "${CYAN}${BOLD}=====================================================${NC}\n\n"

# 1. Kiem tra Docker & Docker Compose
printf "${BLUE}[1/5] Kiem tra Docker Engine...${NC}\n"
if ! command -v docker > /dev/null 2>&1; then
    printf "${RED}[ERROR] Docker chua duoc cai dat hoac chua co trong PATH. Vui long kiem tra lai!${NC}\n"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    printf "${RED}[ERROR] Docker daemon chua khoi dong hoac user hien tai khong co quyen truy cap socket docker!${NC}\n"
    printf "${YELLOW}Goi y: Hay kiem tra 'sudo systemctl status docker' hoac chay bang user co quyen docker.${NC}\n"
    exit 1
fi

# Xac dinh lenh Docker Compose phu hop
if docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    printf "${RED}[ERROR] Khong tim thay 'docker compose' hoac 'docker-compose'.${NC}\n"
    exit 1
fi
printf "${GREEN}✓ Docker dang hoat dong (${DOCKER_COMPOSE})${NC}\n"

# 2. Xu ly cac tham so dong lenh
SKIP_PULL=false
NO_CACHE=""

for arg in "$@"; do
    case $arg in
        --skip-pull)
            SKIP_PULL=true
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            ;;
        -h|--help)
            printf "Cach su dung: ./build.sh [OPTIONS]\n\n"
            printf "Tuy chon:\n"
            printf "  --skip-pull    Bo qua buoc git pull (giu nguyen code hien tai)\n"
            printf "  --no-cache     Build docker image khong su dung cache\n"
            printf "  -h, --help     Hien thi huong dan nay\n"
            exit 0
            ;;
    esac
done

# 3. Git Pull tu branch hien tai
if [ "$SKIP_PULL" = true ]; then
    printf "${YELLOW}[2/5] Bo qua git pull theo yeu cau (--skip-pull)...${NC}\n"
else
    # Kiem tra branch hien tai
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

    if [ -z "$CURRENT_BRANCH" ] || [ "$CURRENT_BRANCH" = "HEAD" ]; then
        printf "${YELLOW}[CANH BAO] Khong xac dinh duoc branch (detached HEAD). Bo qua buoc git pull...${NC}\n"
    else
        printf "${BLUE}[2/5] Dong bo code moi nhat tu branch '%s'...${NC}\n" "$CURRENT_BRANCH"
        printf "Dang chay: ${BOLD}git pull origin %s${NC}...\n" "$CURRENT_BRANCH"
        git pull origin "$CURRENT_BRANCH"
        printf "${GREEN}✓ Dong bo code tu origin/%s thanh cong!${NC}\n" "$CURRENT_BRANCH"
    fi
fi

# 4. Kiem tra file cau hinh .env
printf "${BLUE}[3/5] Kiem tra file cau hinh .env...${NC}\n"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        printf "${YELLOW}[!] Khong tim thay file .env. Dang tao moi tu .env.example...${NC}\n"
        cp .env.example .env
        printf "${GREEN}✓ Da tao file .env tu .env.example. Vui long kiem tra lai cac secret key neu can!${NC}\n"
    else
        printf "${YELLOW}[!] Khong tim thay file .env hoac .env.example.${NC}\n"
    fi
else
    printf "${GREEN}✓ File .env da san sang.${NC}\n"
fi

# 5. Build va khoi chay Docker Containers o che do chay ngam (-d)
printf "${BLUE}[4/5] Build va khoi chay Docker o che do chay ngam (background/daemon)...${NC}\n"
printf "${YELLOW}Luu y: Qua trinh build Docker lan dau co the mat 1-4 phut (tai image, npm install, compile)...${NC}\n"
if [ -n "$NO_CACHE" ]; then
    printf "${YELLOW}Dang build voi tuy chon --no-cache...${NC}\n"
    $DOCKER_COMPOSE build --no-cache
fi

# Tu dong don dep container cloudflared ton dong neu co de tranh loi Conflict name
docker rm -f cloudflared >/dev/null 2>&1 || true

printf "Dang chay: ${BOLD}%s up -d --build --remove-orphans${NC}\n" "$DOCKER_COMPOSE"
if ! $DOCKER_COMPOSE up -d --build --remove-orphans; then
    printf "\n${RED}[ERROR] Qua trinh build hoac khoi dong container that bai!${NC}\n"
    printf "${YELLOW}Cac nguyen nhan pho bien va cach khac phuc:${NC}\n"
    printf "  1. Xung dot cong (Port conflict): Cong 3000, 4000, 5432, 6379 co the dang bi tien trinh khac dung.\n"
    printf "  2. Docker Engine bi day dung luong hoac loi mang khi tai base image.\n"
    printf "  3. Chay truc tiep '${BOLD}%s up --build${NC}' (khong co -d) de xem chi tiet loi tung buoc.\n\n" "$DOCKER_COMPOSE"
    exit 1
fi

# 6. Kiem tra trang thai sau khi chay
printf "${BLUE}[5/5] Kiem tra trang thai cac container...${NC}\n"
sleep 3
$DOCKER_COMPOSE ps

printf "\n${GREEN}${BOLD}================================================================${NC}\n"
printf "${GREEN}${BOLD}   LETSTUN MODULAR ARCHITECTURE (8 SERVICES) IS RUNNING!    ${NC}\n"
printf "${GREEN}${BOLD}================================================================${NC}\n\n"
printf "  ${BOLD}1. Landing & Redirect:${NC}  ${CYAN}http://localhost:3080${NC} -> letstun.site\n"
printf "  ${BOLD}2. Student Frontend:${NC}    ${CYAN}http://localhost:3000${NC} -> app.letstun.site\n"
printf "  ${BOLD}3. Student API:${NC}         ${CYAN}http://localhost:4000${NC} -> app-api.letstun.site\n"
printf "  ${BOLD}4. Kid Frontend:${NC}        ${CYAN}http://localhost:3100${NC} -> kid.letstun.site\n"
printf "  ${BOLD}5. Kid API:${NC}             ${CYAN}http://localhost:4100${NC} -> kid-api.letstun.site\n"
printf "  ${BOLD}6. Admin Frontend:${NC}      ${CYAN}http://localhost:3200${NC} -> admin.letstun.site\n"
printf "  ${BOLD}7. Admin API:${NC}          ${CYAN}http://localhost:4200${NC} -> admin-api.letstun.site\n"
printf "  ${BOLD}8. Assets Service:${NC}      ${CYAN}http://localhost:3300${NC} -> assets.letstun.site\n\n"
printf "  ${BOLD}Database & Cache (Private to 127.0.0.1):${NC}\n"
printf "    - PostgreSQL: ${YELLOW}127.0.0.1:5432${NC}\n"
printf "    - Redis:      ${YELLOW}127.0.0.1:6379${NC}\n\n"
printf "  ${BOLD}Tai khoan mac dinh:${NC}\n"
printf "    - Learner: ${YELLOW}learner@letstun.com${NC} / ${YELLOW}password123${NC}\n"
printf "    - Admin:   ${YELLOW}admin@letstun.com${NC}   / ${YELLOW}admin123${NC}\n\n"
printf "  ${BOLD}Lenh quan tri Docker:${NC}\n"
printf "    - Xem logs tat ca:       ${BOLD}%s logs -f${NC}\n" "$DOCKER_COMPOSE"
printf "    - Xem logs Student API:  ${BOLD}%s logs -f app-api${NC}\n" "$DOCKER_COMPOSE"
printf "    - Xem logs Kid API:      ${BOLD}%s logs -f kid-api${NC}\n" "$DOCKER_COMPOSE"
printf "    - Xem logs Admin API:    ${BOLD}%s logs -f admin-api${NC}\n" "$DOCKER_COMPOSE"
printf "    - Dung toan bo:          ${BOLD}%s down${NC}\n" "$DOCKER_COMPOSE"
printf "${CYAN}================================================================${NC}\n\n"
