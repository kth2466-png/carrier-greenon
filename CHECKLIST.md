# Carrier GreenON 개발 체크리스트

## PHASE 1 — 기본 화면

- [x] 프로젝트 기본 구조 생성
- [x] White + Blue 디자인 시스템
- [x] 모바일 반응형 레이아웃
- [x] 하단 Navigation
- [x] 홈 화면

> 검증 메모 (2026-08-11): 테스트 구문, 화면 구조, 내비게이션 로직과 반응형 CSS를 자동 점검했습니다. 실제 기기 시각 검증은 브라우저 연결 후 FINAL CHECK에서 별도로 진행합니다.

## PHASE 2 — 에어컨 상태

- [x] 가상 Carrier 에어컨 데이터
- [x] POWER 상태
- [x] 냉방 MODE
- [x] 설정온도
- [x] FAN 상태
- [x] 사용시간
- [x] 필터 상태
- [x] 정상 상태 Blue UI
- [x] 비정상 상태 Red UI
- [x] 상태 시뮬레이션 패널

> 검증 메모 (2026-08-11): 정상 상태, 전원 전환, 18~30℃ 온도 제한, FAN 전환, 사용시간 +30분, 필터 경고, 센서 오류와 정상 복구를 자동 검증했습니다. 실제 Carrier API 대신 브라우저 메모리의 시뮬레이션 데이터를 사용합니다.

## PHASE 3 — GREEN MISSION

- [x] 오늘의 미션
- [x] 미션 참여
- [x] 미션 진행 상태
- [x] 진행률 표시
- [x] 시간 +30분 시뮬레이션
- [x] 미션 조건 확인
- [x] 미션 Warning
- [x] 미션 성공
- [x] 미션 실패

> 검증 메모 (2026-08-11): 참여, 50% 진행, 26℃ 미만 조건 경고, 조건 위반 실패, 재도전, 100% 성공과 가상 에어컨 사용시간 연동을 자동 검증했습니다.

## PHASE 4 — GREEN POINT

- [x] 미션 성공 시 포인트 지급
- [x] GREEN WALLET
- [x] 현재 포인트
- [x] 포인트 적립 기록
- [x] 포인트 사용 기록

> 검증 메모 (2026-08-11): 미션 성공 80P 적립, 잔액 갱신, 적립 내역 생성, 중복 지급 방지와 전체·적립·사용 내역 필터를 자동 검증했습니다.

## PHASE 5 — REWARD SHOP

- [x] 리워드 상품 목록
- [x] FOOD 카테고리
- [x] LIFE 카테고리
- [x] CARRIER 카테고리
- [x] 상품 상세
- [x] 포인트 구매
- [x] 포인트 차감
- [x] 포인트 부족 Warning
- [x] 구매내역

> 검증 메모 (2026-08-11): 카테고리 필터, 상품 상세, 구매·차감·내역 생성, 포인트 부족 Red 경고와 지갑 사용 기록 연동을 자동 검증했습니다.

## PHASE 6 — 사용자

- [x] 회원가입
- [x] 로그인
- [x] 로그아웃
- [x] MY 페이지
- [x] GREEN LEVEL
- [x] GREEN REPORT

> 검증 메모 (2026-08-11): Supabase Auth 모의 응답으로 회원가입 확인 안내, 로그인 세션 반영, 로그아웃과 MY 화면 전환을 검증했습니다. 실제 이메일 인증은 배포 후 통합 테스트 항목으로 남겨둡니다.

## PHASE 7 — Supabase

- [x] Supabase 프로젝트 연결
- [x] Auth 연결
- [x] profiles 테이블
- [x] missions 테이블
- [x] user_missions 테이블
- [x] point_transactions 테이블
- [x] rewards 테이블
- [x] reward_orders 테이블
- [x] aircon_status 테이블
- [x] GREEN LEVEL 데이터
- [x] RLS 설정
- [x] 사용자별 데이터 접근 테스트

> 검증 메모 (2026-08-11): 두 개의 임시 Auth 사용자 A/B를 생성해 `authenticated` 역할과 각 JWT `sub`로 조회했습니다. A는 자신의 11P·미션·에어컨 상태만, B는 자신의 22P·미션·에어컨 상태만 조회되어 상호 격리가 확인됐습니다. 테스트 사용자는 연관 데이터와 함께 삭제했고 잔여 데이터 0건을 확인했습니다. SECURITY DEFINER 구현은 `private` 스키마로 옮기고 public RPC는 SECURITY INVOKER 래퍼로 제한했으며 Supabase Security Advisor 경고 0건을 확인했습니다.

## PHASE 8 — 실제 DB 전환

- [x] 임시 사용자 데이터 제거
- [x] 임시 포인트 데이터 제거
- [x] GREEN POINT Supabase 저장
- [x] 미션 기록 Supabase 저장
- [x] 상품 데이터 Supabase 연결
- [x] 구매내역 Supabase 저장
- [x] 새로고침 후 데이터 유지
- [x] 다른 기기 로그인 테스트

> 검증 메모 (2026-08-11): Supabase 프로젝트는 `ACTIVE_HEALTHY`, Security Advisor 경고는 0건입니다. 임시 Auth 사용자로 독립 로그인 요청을 두 번 실행해 두 요청 모두 HTTP 200, 동일 사용자, 서로 다른 access token, 각 세션에서 본인 프로필 1건과 동일한 123P 복원을 확인했습니다. 테스트 세션·사용자·프로필·포인트 데이터는 삭제했고 잔여 0건을 확인했습니다.

## PHASE 9 — 날씨

- [x] 샘플 날씨 데이터
- [x] 날씨 API 연결 구조
- [x] 현재 온도 표시
- [x] 습도 표시
- [x] 날씨 조건별 미션

> 검증 메모 (2026-08-11): Open-Meteo current API 응답 처리, 온도·습도·체감온도·날씨 코드 표시, 기온·습도별 미션 추천, 현재 위치 요청 구조와 API 실패 시 서울 샘플 데이터 및 오류 UI 복구를 자동 검증했습니다.

## PHASE 10 — 배포 준비

- [x] 환경변수 분리
- [x] .env.example
- [x] API Key 노출 검토
- [x] production build 확인
- [x] Git 저장소 정리
- [x] README 작성

> 검증 메모 (2026-08-11): GitHub `kth2466-png/carrier-greenon`에 프로젝트 파일 16개를 업로드했고 원격 blob SHA가 모두 일치했습니다. PR #1을 squash merge해 `main`에 반영했습니다. `.env`, `dist`, secret/service_role/DB 비밀번호는 업로드하지 않았습니다. Render 환경변수 기반 Node 22 정적 빌드와 공개 URL·publishable key 주입 구조도 확인했습니다.

## PHASE 11 — Render 배포

- [x] Render 서비스 생성
- [x] Git 저장소 연결
- [x] 환경변수 등록
- [x] Build 성공
- [x] 배포 성공
- [x] 배포 URL 접속
- [ ] 회원가입 테스트
- [x] 로그인 테스트
- [x] 미션 테스트
- [x] 포인트 적립 테스트
- [x] Reward 구매 테스트

> 배포 검증 메모 (2026-08-11): Render Static Site `carrier-greenon`을 `main` 브랜치에 연결했고 첫 배포 `dep-d9tcs8qjobas73clghp0`가 `live` 상태입니다. `https://carrier-greenon-gzde.onrender.com` 요청은 HTTP 200, Carrier GreenON 제목과 Supabase 설정 스크립트를 반환했습니다. 임시 인증 사용자로 로그인 200, 미션 기록 201, 완료 RPC 200·80P 적립, 50P 상품 구매 200, 앱 계산 잔액 30P와 주문 1건을 확인했습니다. 임시 데이터는 모두 삭제했습니다. 회원가입은 실제 수신 가능한 이메일 확인이 필요해 미완료로 유지합니다.

## FINAL CHECK

- [x] PROJECT.md 요구사항 누락 검사
- [ ] 모바일 화면 검사
- [x] 정상 상태 Blue 확인
- [x] Warning/Error Red 확인
- [x] Supabase 보안 확인
- [x] 전체 기능 자동 회귀 테스트
- [x] 최종 배포 확인

> 최종 검증 메모 (2026-08-11): 필수 화면·DOM ID·내비게이션 대상·반응형 CSS·Blue 정상 상태·Red 오류 상태·Supabase 저장 코드·localStorage 미사용·비밀키 미포함과 production 산출물 무결성을 자동 검사했습니다. 현재 연결 가능한 브라우저가 0개여서 실제 모바일 시각 검사는 보류했고, 배포 URL E2E 검사는 Render 배포가 가능해진 뒤 완료합니다.
