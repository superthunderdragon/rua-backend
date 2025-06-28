# RUA-backend

ExpressJS 기반으로 제작된 RUA 백엔드 서버입니다.

## 설치 및 실행

```bash
git clone https://github.com/superthunderdragon/rua-backend.git
cd lua-backend
pnpm install
pnpm dev
```

## 폴더 구조

```
rua-backend/
├── prisma/
├───── schema.prisma  (데이터베이스 ORM)
├── src/
├───── exceptions/   (글로벌 예외처리 폴더)
├───── middlewares/  (권한 체크 미들웨어)
├───── resources/    (응용 함수)
├───── services/     (서비스 라우팅)
├───────── index.ts     (라우팅 연결)
├───────── [services]/    (서비스 이름)
├───────────── index.ts      (스키마 정의 및 라우팅 연결)
├───────────── controller.ts (라우터별 컨트롤러 모음)
├───── types/        (전역 타입 지정)
├───── app.ts     (서버 초반 설정 및 명세서 생성)
├───── config.ts  (설정 변수)
├───── index.ts   (서버 실행)
```
