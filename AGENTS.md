# AGENT.md

이 문서는 RansomGuard 프론트엔드 프로젝트에서 작업하는 AI 에이전트 및 개발자를 위한 기본 지침과 개발 규칙을 정의합니다.
모든 코드 작성 및 프로젝트 유지보수 시 아래 규칙을 반드시 준수해야 합니다.



## 1. 패키지 매니저 및 런타임 환경 (Bun)

- 본 프로젝트는 **`bun`**을 기본 패키지 매니저 및 런타임으로 사용합니다.
- 패키지 설치, 스크립트 실행, 빌드 등 모든 작업 시 `bun` 명령어를 사용합니다.
  - 의존성 설치: `bun install` / `bun add <package>` / `bun add -d <package>`
  - 개발 서버 실행: `bun run dev`
  - 프로덕션 빌드: `bun run build`
  - Electron 앱 빌드: `bun run build:app`
  - 린트 검사: `bun run lint`
- **주의**: `npm`, `yarn`, `pnpm` 명령어는 사용하지 않습니다.



## 2. 편집 유의사항

- 작업영역 내 `dist`, `node_modules` 폴더 내 모든 파일, 그리고 프로젝트 외부에 위치한 파일 편집은 절대 금지합니다.
  - 그 외 작업영역 내 파일은 얼마든지 생성, 수정, 삭제할 수 있습니다.
- 재사용 가능한 함수와 컴포넌트를 적극적으로 구성하고 활용하여 중복 코드를 최소화합니다.



## 3. UI 컴포넌트 구축 원칙 (shadcn/ui)

- UI 개발 시 **`shadcn/ui`를 적극 활용**합니다.
- **공식 레지스트리 컴포넌트만 허용**:
  - 임의의 외부 비공식 레지스트리나 서드파티 UI 컴포넌트 라이브러리의 무분별한 도입을 금지합니다.
  - shadcn/ui 공식 레지스트리 컴포넌트만을 사용하여 일관성과 유지보수성을 보장합니다.
  - 신규 컴포넌트 추가 시 package.json에 등록된 script를 활용합니다 (예: `bun run shadcn add <component-name>`).
- `shadcn/ui` 컴포넌트 편집 지양
  - shadcn/ui 컴포넌트의 원본 소스코드 보존을 위해 되도록이면 코드를 수정하지 않습니다.
  - 필요한 경우 새로운 파일에서 확장하여 활용합니다.
  - 단, 확장만으로 작업할 수 없는 경우에는 편집을 허용하며, 이 경우 수정한 부분 주위에 주석을 남겨둡니다.



## 4. 스타일링 가이드라인 (Design Consistency)

- **커스텀 스타일 지양**:
  - 모든 페이지 및 컴포넌트의 일관된 디자인 시스템과 사용성을 유지하기 위해 `className`, `style` 등을 활용한 임의의 커스텀 스타일 적용은 **최대한 지양**합니다.
  - `shadcn/ui` 컴포넌트가 제공하는 기본 스타일, Variant, Size 및 CSS 변수 테마를 최대한 그대로 유지하고 활용합니다.
- **커스텀 스타일 허용 기준 (예외사항)**:
  - 레이아웃 배치(Flex, Grid, 간격 등)를 위해 불가피한 경우
  - 화면 기획상 고의적으로 특정 스타일을 변경해야 하는 비즈니스 요구사항이 명확한 경우
  - 위와 같은 예외 상황에 한해서만 최소한의 Tailwind CSS 유틸리티 클래스를 적용합니다.



## 5. 코드 스타일 및 린트 (Lint & Code Quality)

- 코드 스타일과 품질 관리는 프로젝트에 설정된 **ESLint(`eslint.config.js`)**를 기준으로 합니다.
- 코드 작성 및 수정 후에는 항상 린트 검사를 실행하여 오류가 없도록 합니다:

  ```bash
  bun run lint
  ```

- TypeScript 타입 에러 및 미사용 변수/빈 인터페이스(no-empty-object-type) 등 린트 규칙 위반이 발생하지 않도록 코드를 작성합니다.
- 프로덕션 빌드가 정상 통과하는지 검증합니다:

  ```bash
  bun run build
  ```



## 6. 프로젝트 디렉토리 구조 규칙

- `src/components/ui/`: shadcn/ui 공식 컴포넌트 위치
- `src/components/layout/`: Header, Footer 등 레이아웃을 구성하는 공통 UI 블록
- `src/layouts/`: 라우트 수준의 전체 페이지 프레임 레이아웃 (`RootLayout.tsx` 등)
- `src/pages/`: 라우트에 매핑되는 개별 화면 컴포넌트
- `src/router/`: React Router 설정 모듈 (`createBrowserRouter`)
- `src/lib/`: 전역 유틸리티 함수 (`cn` 등)
