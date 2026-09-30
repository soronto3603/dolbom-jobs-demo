# 일자리 웹 데모 구성

## 목적

기존 일자리찾기 앱 디자인과 실제 공개 공고를 활용한 Netlify 배포용 반응형 웹 데모

## 디자인 근거

- 원본 레포 `yeogyung/dolbomdari`
- 디자인 확인 기준 커밋 `478698ff4b83210ef2b81b687903a2745021a60f`
- 목록 `app/(tabs)/index.tsx`, 카드 `components/organisms/JobCard.tsx`, 상세 `app/job/[id].tsx`
- 브랜드 파랑 `#0370FF`, 연회색 배경 `#f5f6f8`, 흰색 카드, 파란 제목, 둥근 필터와 태그
- 모바일 단일 열 카드와 하단 탐색, 데스크톱 필터 사이드바와 카드 두 열
- 원본 로고 사용, 본문은 Noto Sans KR

## 기능과 데이터

- 공고 제목·기관·지역 검색, 지역·근무유형·주당 근무일 수 필터
- 최신순·마감임박순 정렬, 페이지당 12건
- 상세 주소 `/jobs/:id`, 원본에 없는 값은 미기재 표시
- 관심 공고와 최근 본 공고의 브라우저 로컬 저장
- 로그인·지원·전화 연결은 데모 범위 외
- 전체 로컬 스냅샷에서 웹에 필요한 허용 필드만 추출한 공개용 JSON 별도 버전 관리
- 빌드 시 JSON 파일명에 콘텐츠 해시 적용, 배포 간 브라우저 캐시 충돌 방지
- 수집 시점과 데모 상태 표시, 현재 날짜 기준 지난 마감일 표시

## 배포

- React와 Vite 정적 빌드, Node 22, 빌드 명령 `npm run build`, 게시 폴더 `dist`
- Netlify `netlify.toml`에서 상세 경로 새로고침용 SPA rewrite와 헤더 설정
- 데이터 스냅샷 포함으로 빌드 및 웹 실행 시 Supabase 키 불필요
- Netlify 사이트 `dolbom-jobs-demo.netlify.app`, 기본 도메인 `jobs.carebridges.kr`
- 호스팅케이알 외부 DNS CNAME 연결 및 Netlify 소유권 검증 완료
- Let’s Encrypt 인증서 적용 및 실제 도메인의 HTTPS 목록·상세·푸터 확인

## 검증 순서

1. 지역 별칭·검색 결합·근무일 수·날짜 정렬의 경계값 검증
2. 실제 데이터로 웹 빌드와 배포 폴더 검사
3. 브라우저에서 검색·필터·관심 저장·상세 진입 및 새로고침·빈 결과 확인
4. 데스크톱과 모바일 화면 확인

## 참고

[Vite 정적 배포](https://vite.dev/guide/static-deploy) 및 [Netlify SPA 구성](https://docs.netlify.com/build/configure-builds/javascript-spas/) 기준
