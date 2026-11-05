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

## Customer review workflow update

The customer registration, durable reservation request, office approval and demo-payment flows are now implemented. See [the current architecture, API and remaining production work](docs/ARCHITECTURE.md); that document supersedes the initial foundation-only notes above. No cloud deployment or live payment/provider connection is included.

## Notifications update

The account screen now includes in-app notifications, ownership-scoped read state and an explicit push-permission/register/disable control. See [setup and device-build requirements](docs/NOTIFICATIONS.md). Run `npm run lint` and `npm run typecheck` on Node 22. Native push needs EAS/APNs/FCM configuration and device validation; no actual push was sent during QA.

## Account security and paid changes

Email verification, password recovery and session revocation now protect customer writes. Paid changes use a separately reviewed proposal and exact PDF acceptance before the effective booking changes. See [setup, workflow and verification](docs/ACCOUNT_SECURITY_AMENDMENTS.md). This work is stacked on `feature/complete-office-workflows`; live delivery still needs the configured server SMTP environment.

## Native design implementation — phase 1

The entry now uses Expo Router. Discovery, search/filter, saved journeys and tour detail use the approved visual language and the live backend catalogue. Existing account/trips/request flows remain reachable during migration. See [implemented scope, ticket decisions and checks](docs/NATIVE_FOUNDATION.md). This is the first development slice, not the complete 46-screen app.

## Current native customer workflows

The account/trips/planner bridge has been replaced by routed approved screens, including current contract/amendment review, service cancellations/refunds and original travel documents. See [docs/CUSTOMER_WORKFLOWS.md](docs/CUSTOMER_WORKFLOWS.md) for implementation scope and device/release checks. Native PDF viewing requires an internal/custom build (`eas build --profile preview`), not Expo Go.

## Google sign-in

The auth screen shows "Continue with Google" only when the API reports an OAuth client ID for the current platform (`GET /api/v1/auth/google/config`, fed by the backend's `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID` and `GOOGLE_ANDROID_CLIENT_ID`). No client ID is baked into the app; client IDs are public, the app only forwards Google's ID token to `POST /api/v1/auth/google`, which verifies it.

Create these in Google Cloud Console (APIs & Services → Credentials), then set the IDs on the backend:

- **Web** (also used by the hosted web app): authorised JavaScript origin and redirect URI = the public origin that serves the web export.
- **iOS**: bundle ID `az.azertur.customer`. For a native build, add its reversed client ID as a second URL scheme in `app.json` (`"scheme": ["azertur", "com.googleusercontent.apps.<id>"]`).
- **Android**: package `az.azertur.customer` plus the SHA-1 of the signing key (debug and release keys differ).

Google sign-in needs a development or production build (Expo Go cannot use the custom schemes).
