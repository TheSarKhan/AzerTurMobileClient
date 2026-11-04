# Native customer workflows and original documents

This continues PR #4 on `feature/native-customer-workflows`. It replaces the transitional account/trips/planner components with routed React Native screens using the approved ivory/forest design. Approved boards remain in the root `design/approved/mobile-app` archive; this implementation does not replace those approved references.

## Implemented routes

- Account, sign-in/registration, email verification/resend/refresh, email recovery, secure reset-link screen, personal details, language/preferences, help and privacy information.
- Security/session controls, password-reset request, sign-out on this/all devices; notifications with unread filtering, mark-all-read and navigation into the relevant journey workflow. Push opt-in remains explicit and requires EAS configuration.
- Tour or custom connected-day route builder, 1–14 days and 1–12 travelers, service/hotel/guide selection, server estimate, verified-account request submission and request confirmation. The public itinerary draft stays in memory across authentication; it is not a private persistent store. Estimates do not treat the quote calculator's illustrative percentage as an operator-issued deposit.
- Upcoming/request/history trips, journey details, effective service/financial context, current PDF contract preview and explicit exact-hash acceptance. A PDF load/error, version refresh or background transition resets review eligibility. Server checks remain authoritative.
- Payment request/history review, revised-plan acceptance, service-specific cancellation request, operator-reviewed refund tracking, amendment PDF/amounts review and exact-version acceptance/decline.
- Tickets/documents: All includes upcoming and active items, plus archive; per-booking and all-booking views; original PDF/JPG/PNG viewing, current-version links, invalid/replaced/revoked/review-needed warnings, offline checks and explicit export/share. No airline code, ticket or boarding right is generated.

## Backend and office counterpart

Requires `AzerTurBackend` branch `feature/travel-documents` (Flyway V17–V18) and the office branch with the same name. The office uploads an original up to 10,000,000 bytes, specifies service/kind, actual validity instants and IANA timezone, reviews the file, checks the correct customer/journey, records preview and publishes. Only the newest draft can publish. Publishing supersedes the prior published slot; customer access is owner-scoped and excludes unpublished drafts. Revocation and service-revision changes make a document non-actionable. Original bytes are preserved and their SHA-256 is verified by mobile. Metadata/check time is an AzərTur server check, not live airline status.

## Protected native offline copies

Native-only `vault.native.ts` encrypts file contents AND the metadata index with Expo Crypto AES-256-GCM. The current owner's key is in SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`; ciphertext stays in app-private files. AsyncStorage never holds private files/metadata or tokens. Vault operations serialize index updates and use a generation barrier so sign-out wins over pending writes. Owner mismatch is rejected. Account change, logout, logout-all and session rejection destroy the cache/key. Successful online refresh updates archived/revoked states and removes missing cached documents.

Opening a file creates a temporary decrypted preview, removed on unmount/background and cleaned at app startup. Native PDF uses a local file URI (`cache:false`, no network PDF URL), so the viewer does not download a second persistent original. Share/download is explicit; the temporary exported file is removed when the share sheet finishes. Copies exported to another app are outside this app's control. Offline UI always shows the last check and warns that revocation/replacement may have occurred since then. Web previews use temporary object URLs and intentionally have no persistent private offline cache.

## Validation and release limits

`npm run typecheck`, `npm run lint`, `npm test`, Node 22 `npx expo config --type prebuild`, and `npx expo export --platform all --output-dir dist`.

The five vault tests execute the actual native vault source against deterministic filesystem/SecureStore adapters and real Node AES-GCM: encryption of both content/index, exact decryption, owner isolation, tamper rejection, status synchronization, concurrent writes and logout cleanup. They are not a device Keychain/Keystore test. Backend unit and loopback integration tests cover actual multipart parsing, file validation, ownership, draft secrecy, preview/publish, stale versions, original bytes, revocation and service-revision invalidation.

Browser UI QA uses a separate local QA database/API with email/push disabled and synthetic accounts/files. It verifies the React Native web rendering and navigation. Android/iOS JS exports and config resolution are NOT native binaries, signed builds or physical-device tests. `react-native-pdf` requires a custom native build; this feature cannot run in Expo Go. Config plugins are provided; native PDF/zoom/offline/sharing must still be validated on signed iOS/Android builds. No Android SDK or Xcode simulator is configured on this machine.

Live checkout is deliberately unavailable until Epoint merchant configuration and a supported checkout endpoint are connected. No real money is charged. Gmail SMTP, push credentials, production legal/privacy text, supplier documents, deployment and store signing remain external release setup. Help/privacy screens do not invent contact details or claim draft explanatory text is a final legal policy. Existing transitive dependency audit findings are not resolved by a JS export; do not force an incompatible Expo upgrade.

Local web preview uses port 8083 with API 8080; isolated verification uses 8084 with API 8085. Native devices require their reachable API host over HTTPS rather than localhost.

Independent passengers/flight legs use separate document groups. Upload defaults to a new document; explicit `replaces` references an existing document in the same booking/service/kind and creates a new version only within that group. Publishing one passenger’s ticket never supersedes a different passenger’s original.

Web PDF preview uses Mozilla PDF.js canvas rendering and page navigation rather than relying on an iframe load event. The matching locked worker is copied by postinstall; confirmation is unlocked only after a real page render and explicit review. Browser QA confirmed the PDF is visible, the acknowledgement enables Confirm, and refresh resets it without submitting acceptance. Three additional date tests cover full catalogue/custom duration and Baku last-day boundaries.
