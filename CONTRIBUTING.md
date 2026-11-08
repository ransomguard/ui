# Contributing Guide

이 문서에서 다루지 않은 부분은 정해진 규칙이 없습니다.
어떠한 형태의 기여도 자유롭게 환영합니다.



## Development Environment

패키지 및 스크립트 관리를 위해 [Bun](https://bun.sh/)을 사용합니다. (작성 기준 환경: v1.3.14)
단, 내부 소스코드 자체는 Bun에 종속성을 가지지 않으므로 유연하게 작업할 수 있습니다.



## Getting Started

개발 시 사용되는 기본 명령어입니다.

### Install

```shell
bun ci
```

### Development Mode

```shell
bun run dev
```

### Build

빌드 시 `release/0.0.0/` 디렉토리 내 OS별 배포용 실행 파일이 생성됩니다.

```shell
bun run build
```

### mock

엔진 없이 UI 동작만 테스트하려면 개발 서버(`bun run dev`) 실행 후 Mock IPC 스크립트를 사용할 수 있습니다.

```shell
# 최근 90일 내 랜덤 이벤트 100개 전송 (기본값: 50)
bun run mock:ipc -c 100

# 100개 전송 후 실시간 스트리밍(--stream, 주기 -i ms)
bun run mock:ipc -c 100 --stream -i 2000
```



## Development Guidelines

### Cross Platform

> [!IMPORTANT]
> 개발 시 엔진이 지원하는 OS나 환경을 고려하지 않습니다.
> (특정 OS 및 환경에 종속되는 코드는 작성하지 않습니다.)

이 앱은 Windows, Linux, macOS 등 Electron이 지원하는 모든 환경에서 동일하게 동작하는 것을 목표로 합니다.
엔진 지원 환경에 따라 어떠한 환경에서도 즉시 사용할 수 있도록 확장성을 고려하여 개발합니다.
(단, 엔진과 IPC 기반으로 통신하기 때문에 웹 환경은 지원하지 않습니다.)

### UI

일관된 디자인 시스템을 위해 `shadcn/ui`를 활용합니다.

`shadcn/ui`의 특성상 컴포넌트 코드가 로컬에 직접 설치되므로, 추후 업데이트 및 유지보수를 위해 원본 컴포넌트의 직접적인 수정은 최소화합니다.
기능이나 스타일 등 변경이 필요할 경우 커스텀 컴포넌트로 확장하여 적용하는 것을 권장하며, 불가피한 경우에만 예외적으로 원본 코드를 수정합니다.

### i18n

Electron의 상단 메뉴를 포함하여 클라이언트 화면에 노출되는 모든 텍스트 문구는 반드시 i18n 시스템을 활용하여 작성합니다.
현재 지원하지 않는 새로운 언어를 추가할 수 있습니다.

- Electron: `electron/locales/`
- React: `src/locales/`
