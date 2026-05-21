#!/bin/bash
# ============================================
# iSensSign 배포 스크립트
# Usage: ./scripts/deploy.sh [up|down|rebuild|logs|migrate|seed]
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# .env.production 파일 확인
check_env() {
    if [ ! -f .env.production ]; then
        echo "[오류] .env.production 파일이 없습니다."
        echo "  cp .env.production.example .env.production"
        echo "  파일을 생성한 후 값을 채워주세요."
        exit 1
    fi
}

case "${1:-help}" in
    up)
        check_env
        echo "[배포] 서비스를 시작합니다..."
        docker compose up -d
        echo "[완료] http://localhost:3000 에서 확인하세요."
        ;;
    down)
        echo "[중지] 서비스를 중지합니다..."
        docker compose down
        echo "[완료] 서비스가 중지되었습니다."
        ;;
    rebuild)
        check_env
        echo "[재빌드] 이미지를 다시 빌드하고 서비스를 재시작합니다..."
        docker compose down
        docker compose build --no-cache
        docker compose up -d
        echo "[완료] 재빌드가 완료되었습니다."
        ;;
    logs)
        docker compose logs -f "${2:-app}"
        ;;
    migrate)
        check_env
        echo "[마이그레이션] Prisma 마이그레이션을 실행합니다..."
        docker compose exec app npx prisma migrate deploy
        echo "[완료] 마이그레이션이 완료되었습니다."
        ;;
    seed)
        check_env
        echo "[시드] 데이터베이스 시드를 실행합니다..."
        docker compose exec app npx prisma db seed
        echo "[완료] 시드가 완료되었습니다."
        ;;
    help|*)
        echo "iSensSign 배포 스크립트"
        echo ""
        echo "사용법: ./scripts/deploy.sh <명령>"
        echo ""
        echo "명령:"
        echo "  up       - 서비스 시작 (docker compose up -d)"
        echo "  down     - 서비스 중지 (docker compose down)"
        echo "  rebuild  - 이미지 재빌드 후 재시작"
        echo "  logs     - 로그 확인 (기본: app, 예: logs db)"
        echo "  migrate  - Prisma 마이그레이션 실행"
        echo "  seed     - 데이터베이스 시드 실행"
        echo ""
        ;;
esac
