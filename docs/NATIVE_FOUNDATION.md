# Approved mobile UI — first development slice

This branch is stacked on feature/verified-accounts-paid-amendments. All 46 design artboards were approved for development. This first slice implements the native routing/design foundation and discovery; it does not claim the complete mobile app or tickets system is finished.

## Implemented

Expo Router entry and file-based stack/tab routes; shared ivory/forest/terracotta theme, Inter body fonts and platform serif heading fallback; consistent Feather icons and safe areas. Native fonts will need final cross-device typography validation.

Explore loads the existing Spring Boot catalogue. Category selection, localized titles, search across EN/RU/AZ and region/slug, duration/region/maximum-EUR-starting-price filters and empty/retry states use that real catalogue. Cards link to real tour IDs, detail pages and the existing quote/request flow. Approved website photography is bundled rather than replaced by unrelated stock.

Saved slugs and locale persist in AsyncStorage. These are public preferences, never credentials, passenger documents or offline private files. Existing auth continues to use SecureStore on native and memory-only tokens on web. Account/trips and quote/request controls are transitional existing components embedded behind the new routes; their final approved UI and the full custom route/service builder are still to be migrated. Focus refresh re-reads the authenticated account. New verified accounts go to Account before customer writes; navigation to account/trips uses the router.

Discovery estimates currently use the catalogue's actual EUR starting-price field. The new discovery UI does not fabricate currency conversion or final service prices. Sample labels in design boards are replaced by actual API titles/prices.

## Explicit ticket decisions

The user selected original-document upload by office staff, PDF/JPG/PNG up to 10 MB; the operator previews and checks the customer/journey before publishing. The latest version is current, older versions remain clearly replaced/invalid in archive. Private offline copies must be protected and show the last verification time. Download/share is explicitly initiated by the customer. Internal company QR validation is deferred; never fabricate airline boarding passes or barcode entitlements.

These decisions are accepted scope, not yet implemented in this slice. Document upload/publish/version/revocation endpoints, office UI, owner-scoped retrieval, protected native offline storage and export/share are the next integration work. Offline status cannot assert a fresh supplier validation, and app logout/account switch must clear private cached documents. AsyncStorage is not an acceptable private-document store.

## Verification and local preview

Use Node 22 and npm ci, npm run typecheck, npm run lint, then npx expo export --platform all --output-dir dist. A bundle export is not an APK/IPA or a physical-device test.

Local preview: npx expo start --web --port 8083 --localhost. The web API origin must be allowed in the local backend CORS config; this QA run used http://localhost:8083 with the API bound to loopback. Keep EMAIL_ENABLED=false and PUSH_ENABLED=false for local QA. For a physical device, configure the actual API address explicitly.

Browser QA at a 390×844 viewport verified live catalogue display, save/remove and persistence over reload, tour detail, the selected-tour request form handoff, search, combined duration/price filtering, empty result and clearing filters. No customer booking, contract acceptance, payment, email or push was submitted in this QA.

npm audit currently reports inherited/transitive findings in the Expo toolchain, including @expo/cli/node-forge/zod. They were inspected without applying a force upgrade outside SDK-compatible ranges. Dependency remediation and signed-device validation remain part of release hardening; a green build is not a security audit.
