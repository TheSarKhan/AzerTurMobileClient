# app.aztrip.online

This container serves the Expo web export of the customer application. API calls go to https://api.aztrip.online; credentials are never included in the image. The API CORS allowlist must include https://app.aztrip.online. TLS is terminated by the existing origin Nginx proxy and Cloudflare.

Build: `docker build -t aztrip-mobile-web:VERSION .`
Run with loopback binding: `docker run -d --restart unless-stopped -p 127.0.0.1:8104:8080 aztrip-mobile-web:VERSION`.

The backend deployment workflow owns provisioning, database backup, compatibility validation, and rollout. Pin both source commits when dispatching it. The origin serves SPA fallback for Expo Router deep links and the matching PDF.js worker. API responses and private documents are never part of this static export.

Web sessions are memory-only. Encrypted offline document storage and device push notifications belong to native iOS/Android builds; browser downloads require a customer action.
