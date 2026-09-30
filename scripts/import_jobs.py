import argparse
from collections import Counter
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import tempfile
from urllib.error import HTTPError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
PROJECT_HOST = "qxihbjhjiqhlqegjzvpo.supabase.co"
FIELDS = (
    "id", "source", "title", "work_type", "salary", "min_sal", "max_sal",
    "location", "days", "time", "company", "registration_date", "deadline_date",
    "is_active", "created_at", "updated_at", "deleted_at", "legal_dong_code",
    "required_qualification", "experience_preference", "recruit_job", "work_days",
    "days_negotiable", "time_negotiable", "salary_type", "salary_display_type",
    "senior_biz_type", "activity_name", "recruit_count", "activity_period",
    "activity_pay_method", "benefits", "work_form", "dayoff_condition", "shuttle",
    "night_shift",
)
TEST_PATTERN = re.compile(r"테스트|테스트용|샘플|\b(?:test|sample|dummy)\b", re.I)


def read_env(path):
    values = {}
    if path.exists():
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.removeprefix("export ").split("=", 1)
            values[key.strip()] = value.strip().strip("\"'")
    return values | dict(os.environ)


def fetch_jobs(env):
    base = env.get("SUPABASE_URL") or env.get("EXPO_PUBLIC_SUPABASE_URL", "")
    key = env.get("SUPABASE_PUBLISHABLE_KEY") or env.get("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")
    if urlparse(base).hostname != PROJECT_HOST or urlparse(base).scheme != "https":
        raise ValueError("기존 Supabase 프로젝트 HTTPS 주소 확인 필요")
    if not key or key.startswith("sb_secret_"):
        raise ValueError("공개 조회용 publishable 또는 anon 키 필요")
    if key.startswith("eyJ"):
        import base64
        claims = json.loads(base64.urlsafe_b64decode(key.split(".")[1] + "==="))
        if claims.get("role") != "anon":
            raise ValueError("anon 권한 키만 허용")
    rows, total, offset = [], None, 0
    while total is None or offset < total:
        query = urlencode({
            "select": ",".join(FIELDS), "is_active": "eq.true", "deleted_at": "is.null",
            "order": "id.asc", "limit": 500, "offset": offset,
        })
        request = Request(base.rstrip("/") + "/rest/v1/jobs?" + query,
                          headers={"apikey": key, "Prefer": "count=exact"}, method="GET")
        try:
            with urlopen(request, timeout=60) as response:
                current_total = int(response.headers["Content-Range"].rsplit("/", 1)[1])
                page = json.load(response)
        except HTTPError as error:
            raise RuntimeError(f"Supabase 조회 실패 HTTP {error.code}") from None
        if total is not None and total != current_total:
            raise RuntimeError("수집 중 공고 건수 변경 감지, 재실행 필요")
        total = current_total
        if not page and offset < total:
            raise RuntimeError("페이지 누락 감지")
        rows.extend(page)
        offset += len(page)
    if len(rows) != total or len({row["id"] for row in rows}) != total:
        raise RuntimeError("공고 건수 또는 ID 중복 검증 실패")
    return rows


def excluded_reason(row, today):
    if TEST_PATTERN.search(" ".join(str(row.get(key) or "") for key in ("title", "company", "location"))):
        return "test_or_sample"
    if row.get("deadline_date") and row["deadline_date"] < today:
        return "past_deadline"
    if not all(str(row.get(key) or "").strip() for key in ("id", "title", "company", "location", "salary")):
        return "missing_required_field"
    return None


def write_snapshot(rows, output, now):
    excluded = Counter()
    jobs = []
    for row in rows:
        reason = excluded_reason(row, now.date().isoformat())
        if reason:
            excluded[reason] += 1
        else:
            jobs.append({key: row[key] for key in FIELDS if key != "deleted_at"})
    if not jobs:
        raise RuntimeError("데모 대상 공고 없음, 스냅샷 생성 중단")
    jobs.sort(key=lambda row: (row.get("created_at") or "", row["id"]), reverse=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        raise FileExistsError("출력 경로 존재, 새로운 --output 경로 지정 필요")
    staging = Path(tempfile.mkdtemp(prefix=".jobs-", dir=output.parent))
    try:
        json_path = staging / "jobs.json"
        json_path.write_text(json.dumps(jobs, ensure_ascii=False, indent=2) + "\n")
        with sqlite3.connect(staging / "jobs.sqlite3") as db:
            db.execute("CREATE TABLE jobs (id TEXT PRIMARY KEY, title TEXT NOT NULL, company TEXT NOT NULL, location TEXT NOT NULL, work_type TEXT, salary TEXT NOT NULL, source TEXT NOT NULL, deadline_date TEXT, payload TEXT NOT NULL CHECK(json_valid(payload)))")
            db.executemany("INSERT INTO jobs VALUES (?,?,?,?,?,?,?,?,?)", [
                (row["id"], row["title"], row["company"], row["location"], row["work_type"],
                 row["salary"], row["source"], row["deadline_date"], json.dumps(row, ensure_ascii=False))
                for row in jobs
            ])
            db.execute("CREATE INDEX jobs_location_idx ON jobs(location)")
            db.execute("CREATE INDEX jobs_work_type_idx ON jobs(work_type)")
            if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise RuntimeError("SQLite 무결성 검증 실패")
            stored = [json.loads(item[0]) for item in db.execute("SELECT payload FROM jobs ORDER BY id")]
            if stored != sorted(jobs, key=lambda row: row["id"]):
                raise RuntimeError("SQLite와 JSON 공고 불일치")
        manifest = {
            "project_ref": PROJECT_HOST.split(".")[0], "table": "public.jobs",
            "captured_at": now.isoformat(), "timezone": "Asia/Seoul",
            "source_filter": "is_active=eq.true&deleted_at=is.null",
            "source_count": len(rows), "imported_count": len(jobs),
            "excluded": dict(excluded), "fields": [key for key in FIELDS if key != "deleted_at"],
            "by_source": dict(Counter(row["source"] for row in jobs)),
            "by_work_type": dict(Counter(row["work_type"] or "미지정" for row in jobs)),
            "by_region": dict(Counter((row["location"].split() or ["미지정"])[0] for row in jobs)),
            "null_deadline_count": sum(row["deadline_date"] is None for row in jobs),
            "latest_source_updated_at": max(row.get("updated_at") or "" for row in rows),
            "sha256": {name: hashlib.sha256((staging / name).read_bytes()).hexdigest()
                       for name in ("jobs.json", "jobs.sqlite3")},
            "limitations": ["페이지 단위 REST 조회로 트랜잭션 스냅샷 보장 불가", "마감일 미지정 공고의 실제 모집 여부 별도 확인 필요", "테스트 제외 기준은 제목·기관명·지역 키워드 검사", "자유 텍스트 내 개인정보 완전 탐지 미지원"],
        }
        (staging / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        staging.rename(output)
        return manifest
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def main():
    now = datetime.now(ZoneInfo("Asia/Seoul"))
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-file", type=Path, default=ROOT / ".env")
    parser.add_argument("--output", type=Path, default=ROOT / "data" / now.strftime("%Y%m%d-%H%M%S"))
    args = parser.parse_args()
    manifest = write_snapshot(fetch_jobs(read_env(args.env_file)), args.output.resolve(), now)
    print(json.dumps({"output": str(args.output.resolve()), **manifest}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
