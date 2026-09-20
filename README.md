# React + TypeScript + Vite

[Bun](https://bun.sh)
기반이지만 단순 실행만 하려면 `npm`으로 사용 가능
(명령어에서 `bun`을 `npm`으로 변경)



## 설치

```shell
bun install
```



## 실행

### 개발 모드

개발 모드로 실행 중 소스코드 변경 시 즉시 반영됨

```shell
bun run dev
```

### 빌드 후 실행

```shell
bun run build
bun run preview
```

### 앱 빌드

`--linux`, `--win`, `--mac` 옵션을 추가하여 빌드 가능하지만,
로컬에서 다른 OS용 앱을 빌드하는 경우 별도의 추가 구성 필요.

```shell
bun run build:app
```
