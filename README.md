# Carrier GreenON

Carrier 에어컨 사용자를 위한 ESG 친환경 냉방 미션·GREEN POINT·리워드 웹앱입니다. 실제 에어컨 API 대신 사용자별 Supabase 가상 IoT 데이터를 사용합니다.

## 주요 흐름

회원가입/로그인 → 날씨와 가상 에어컨 확인 → GREEN MISSION 참여 → 30분 단위 시뮬레이션 → 포인트 적립 → 리워드 구매 → GREEN REPORT 확인

## 기술 구성

- 프런트엔드: HTML, CSS, Vanilla JavaScript
- 인증·데이터베이스: Supabase Auth, Postgres, RLS
- 날씨: Open-Meteo Forecast API (실패 시 서울 샘플 데이터)
- 배포: Render Static Site

## 환경변수

`.env.example`을 참고해 다음 두 값을 설정합니다.

- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_PUBLISHABLE_KEY`: 브라우저 공개용 Publishable Key

`service_role`, `sb_secret_` 키와 데이터베이스 비밀번호는 프런트엔드 또는 Render 정적 사이트 환경변수에 등록하지 않습니다.

## Production build

Node.js 22 이상에서 실행합니다.

```bash
npm run build
```

빌드 결과는 `dist/`에 생성됩니다. 빌드 스크립트는 환경변수를 읽어 `dist/supabase-config.js`를 만들며 나머지 정적 파일을 복사합니다.

## Render 배포

저장소 루트의 `render.yaml` Blueprint를 사용합니다. 최초 생성 시 Render에서 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` 값을 입력하고, 배포 URL을 Supabase Auth의 Site URL 및 허용 Redirect URL에 등록합니다.

## 보안

- 모든 사용자 소유 Supabase 테이블에 RLS 적용
- 포인트 지급과 구매는 인증 사용자 전용 Postgres RPC에서 처리
- 사용자 권한 판단에 수정 가능한 `user_metadata`를 사용하지 않음
- 공개 카탈로그와 사용자별 데이터의 권한 분리
- 비정상 상태와 오류만 Red UI 사용
