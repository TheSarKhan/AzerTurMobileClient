# AzerTurMobileClient

Customer mobile app foundation · React Native / Expo SDK 58 / TypeScript.

```sh
nvm use
npm ci
cp .env.example .env
npm start
```

`EXPO_PUBLIC_API_BASE_URL` points to Spring Boot. iOS Simulator uses `http://localhost:8080`. Android Emulator uses `http://10.0.2.2:8080`. For a physical device use the computer's LAN address and explicitly configure backend binding. Never put secrets in `EXPO_PUBLIC_` variables.

The first customer screen loads the catalogue, selects a tour, accepts departure/travellers and requests a quote from Java. Accounts, durable trips, native checkout, push notifications and store distribution are future work.

```sh
npm run typecheck
npx expo export --platform android --output-dir dist
```

This export checks Metro/native JavaScript bundling; it does not produce or verify an APK or IPA. Use a compatible Node LTS (22.13+ within Node 22); `.nvmrc` and CI select Node 22. See [architecture](docs/ARCHITECTURE.md).
