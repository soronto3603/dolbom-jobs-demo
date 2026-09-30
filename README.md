# 돌봄다리 일자리 데모

기존 일자리찾기 앱 디자인과 실제 공개 공고 5,384건을 활용한 반응형 웹 데모

React · Vite · 정적 JSON · Netlify 배포 구성

## 실행

Node 22.12 이상 환경

```bash
npm ci
npm run dev
npm run build
npm run preview
```

검색·지역 및 근무일 필터·근무유형 선택·페이지 이동·공고 상세·관심 공고·최근 본 공고 제공

관심 및 열람 기록은 현재 브라우저의 로컬 저장소 사용, 로그인·실제 지원·전화 연결 미포함

원본 앱의 브랜드 파랑·로고·태그·공고 정보표·관심 및 상세 버튼 유지, PC 두 열과 모바일 단일 열 구성

## Netlify 배포

Netlify에서 GitHub 저장소 `soronto3603/dolbom-jobs-demo` 연결

| 설정 | 값 |
|---|---|
| 배포 브랜치 | `main` |
| Base directory | 저장소 루트, 입력 없이 유지 |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node | `22` |
| 필수 환경변수 | 없음 |

`netlify.toml`에 빌드·게시 경로·SPA rewrite·기본 헤더 포함

상세 경로 `/jobs/:id`와 `/saved`, `/recent` 직접 접근 및 새로고침 지원

완성된 `dist` 폴더 수동 업로드도 가능, 직접 업로드 시 `netlify.toml` 없이도 rewrite와 헤더가 적용되도록 `public/_redirects` 및 `public/_headers` 포함

데이터는 해시가 붙은 정적 파일로 배포, 브라우저 또는 Netlify 환경의 Supabase 키 불필요

사용 도메인 확정 후 Netlify 도메인 설정에서 추가하고 안내되는 DNS 레코드 연결, 실제 도메인 연결은 미수행 상태

[Netlify SPA 공식 문서](https://docs.netlify.com/build/configure-builds/javascript-spas/) 및 [Vite 배포 공식 문서](https://vite.dev/guide/static-deploy) 참고

## 검증

```bash
npm test
npm run build
npm run test:browser
```

브라우저 검증은 설치된 Chrome 사용, 별도 머신에서는 Chrome 설치 필요

공고 필터·지역 별칭·한국 시각 마감일·불명확한 근무시간 처리 단위 검증과 실제 빌드 대상 PC·모바일 브라우저 동작 검증

## 데이터 적재

Python 3.10 이상 표준 라이브러리 사용, 별도 패키지 설치 불필요

```bash
cp .env.example .env
# .env에 기존 프로젝트의 공개 조회 키 입력
python3 scripts/import_jobs.py
```

현재 작업환경의 기존 설정을 직접 사용하는 명령

```bash
python3 scripts/import_jobs.py --env-file ../db-operation-rn/.env
```

| 파일 | 용도 |
|---|---|
| `data/수집시각/jobs.json` | 웹 화면용 공고 목록·상세 데이터 |
| `data/수집시각/jobs.sqlite3` | 검색·필터 확인용 로컬 DB |
| `data/수집시각/manifest.json` | 수집 시각·건수·제외 사유·분포·파일 해시 |

SQLite 주요 검색 필드의 컬럼 제공 및 전체 허용 필드의 `payload` JSON 보관

공개 권한으로 조회 가능한 활성·미삭제 공고만 조회, 한국 시각 기준 지난 마감일·테스트 공고·필수 필드 누락 공고 제외

전화번호·회원 정보·지원자 정보·돌봄 대상자 상태·상세 주소·자유 서술 본문 제외

마감일 미지정 공고는 유지, 실제 모집 여부에 대한 별도 검증 미포함

운영 Supabase에 대한 조회만 수행, 스키마·정책·원본 데이터 변경 없음

전체 원본 스냅샷과 키는 Git 추적 제외

## 웹 공개용 데이터 갱신

```bash
python3 scripts/import_jobs.py --env-file ../db-operation-rn/.env
npm run data:prepare -- data/새로운수집시각
npm run build
```

`web-data/jobs.json`은 배포용 허용 필드 15개만 포함한 별도 데이터셋, 해당 파일 커밋 후 재배포 시 반영

환경변수·원본 DB·원본 앱 소스와 독립적인 빌드 가능

데이터 갱신은 수동 방식, 수집 시점 표시 및 마감일 미기재 공고의 실제 모집 여부 확인 필요
