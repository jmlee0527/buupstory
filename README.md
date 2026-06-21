# AI 활용 연구소

정적 정보 사이트와 워드프레스 느낌의 CMS-lite 관리자 UI가 포함된 프로젝트입니다. Replit 또는 로컬 Node 환경에서 바로 미리보기할 수 있습니다.

## 실행 방법

```bash
npm install
npm run build
npm run dev
```

`npm run build`는 `data/`의 설정, 카테고리, 글, 칼럼 데이터를 읽어 개별 URL 폴더, `sitemap.xml`, `feed.xml`, `robots.txt`를 생성합니다.

## 관리자 모드

- 주소: `/admin/`
- 아이디: `admin`
- 비밀번호: `eportal7`

관리자 화면은 정적 사이트용 CMS-lite 데모입니다. 실제 보안 인증, 데이터베이스, 권한 관리가 포함된 시스템이 아닙니다. 저장 데이터는 브라우저 `localStorage`에 보관되며, 기기나 브라우저가 바뀌면 유지되지 않을 수 있습니다.

관리자에서 수정한 내용은 `JSON export`로 내려받은 뒤 운영 데이터 파일에 반영하고 `npm run build`를 다시 실행하는 방식으로 배포 파일에 반영할 수 있습니다. 추후 Supabase, Firebase, Git 기반 CMS 같은 저장소로 확장할 수 있도록 데이터가 분리되어 있습니다.

## 구글 서치콘솔, 사이트맵, RSS

- 사이트맵: `/sitemap.xml`
- RSS: `/feed.xml`
- robots: `/robots.txt`

구글 서치콘솔 등록 시 도메인 `https://www.buupstory.kr/`를 등록하고, 사이트맵 제출란에 `https://www.buupstory.kr/sitemap.xml`을 제출하면 됩니다. 메타 태그 방식 검증이 필요하면 `data/site.config.js`의 `googleSiteVerification` 값에 발급받은 코드를 넣고 `npm run build`를 실행하세요.

## 수정 위치

- 사이트명: `data/site.config.js`의 `siteName`
- 색상: `data/site.config.js`의 `mainColor`, `subColor`
- 이메일: `data/site.config.js`의 `email`
- 운영자명: `data/site.config.js`의 `authorName`
- 카테고리: `data/categories.js`
- 일반 글: `data/posts.js`
- 칼럼: `data/columns.js`
- 관리자 기본 문구: `data/site.config.js`의 `adminNotice`, `assets/js/main.js`의 관리자 렌더링 문구

## 포함 페이지

홈, 카테고리 목록, 카테고리 상세, 글 상세 15개, 칼럼 목록, 칼럼 상세 3개, 사이트 소개, 운영자 소개, 문의, 개인정보처리방침, 이용약관, 면책고지, HTML 사이트맵, 404, 관리자 모드가 포함되어 있습니다.
