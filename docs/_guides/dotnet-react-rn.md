# .NET + React + React Native pilot

## First run

```bash
cp .env.stack.example .env.stack
npm ci
./scripts/dev web
```

Run `./scripts/dev mobile` in another terminal for Expo.

## API URL contract

- Browser and iOS simulator default: `http://localhost:8080`.
- Android emulator default: `http://10.0.2.2:8080`.
- Physical device: set `EXPO_PUBLIC_API_BASE_URL` to the development machine's
  reachable LAN address. Do not use `localhost` from a physical device.
- Set `CORS_ORIGINS` to a comma-separated allowlist; never use `*` when
  credentials are introduced.

## Contract workflow

Edit `contracts/openapi.yaml`, run `./scripts/generate-clients`, review the
generated diff, then run `./scripts/test`. Never edit
`packages/api-client` manually.

## Supported hosts

Local development is supported on Linux and macOS with Docker, Node.js 22.13+
and npm. CI runs on Linux. Native device/simulator tooling follows Expo's
platform requirements.
