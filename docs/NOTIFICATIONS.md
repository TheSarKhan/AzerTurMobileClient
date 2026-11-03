# Customer notifications

The account view includes an authenticated in-app inbox with read state and opt-in push enable/disable. The device token is registered to the current server session and stored locally using Expo SecureStore; a different signed-in session does not silently adopt it. Logout/expiry invalidates pending server deliveries for that session. No SMS is used.

Set EXPO_PUBLIC_EAS_PROJECT_ID to the project's public UUID and configure Android/iOS push credentials in EAS. The server needs PUSH_ENABLED=true and, if enabled on the Expo project, EXPO_ACCESS_TOKEN. No secret belongs in an EXPO_PUBLIC variable. The expo-notifications config plugin is included. A push-capable device build is required; a plain JS export is not an APK/IPA, push entitlement validation or store release. No project UUID, native signing identity or provider secret has been invented.

Backend reference: AzerTurBackend/docs/OFFICE_WORKFLOWS.md. Expo references: https://docs.expo.dev/versions/v58.0.0/sdk/notifications/ and https://docs.expo.dev/push-notifications/sending-notifications/ . Tickets/receipts do not prove that a user saw a message.

Validation: TypeScript, ESLint and Android Metro export pass. CI runs lint/typecheck and Android/iOS exports on Node 22. Local ESLint was introduced to satisfy the repository checks; the existing mount-only session restore is explicitly documented, and the legacy demo-only request-key helper was moved out of the component to avoid treating event-time randomness as render logic. No simulator/device push test or real notification delivery was performed.
