#!/bin/bash
# ============================================
# PostgreSQL 백업 스크립트
# 매일 cron으로 실행 권장: 0 3 * * * /path/to/scripts/backup.sh
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 설정
BACKUP_DIR="${PROJECT_DIR}/backups"
CONTAINER_NAME="docusign-ko-db-1"
DB_NAME="isenssign"
DB_USER="isenssign"
KEEP_DAYS=7

# 백업 디렉터리 생성
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[백업] ${DB_NAME} 데이터베이스 백업을 시작합니다..."
echo "[백업] 파일: ${BACKUP_FILE}"

# pg_dump 실행 후 gzip 압축
docker compose -f "${PROJECT_DIR}/docker-compose.yml" exec -T db \
    pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl \
    | gzip > "$BACKUP_FILE"

# 백업 파일 크기 확인
if [ -s "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[완료] 백업 성공 (${SIZE})"
else
    echo "[오류] 백업 파일이 비어있습니다. 백업에 실패했습니다."
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 오래된 백업 삭제 (KEEP_DAYS일 이전)
DELETED=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +${KEEP_DAYS} -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[정리] ${KEEP_DAYS}일 이전 백업 ${DELETED}개를 삭제했습니다."
fi

echo "[백업] 현재 보관 중인 백업 목록:"
ls -lh "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null || echo "  (없음)"
