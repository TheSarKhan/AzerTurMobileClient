# Dependency review — 25 October 2026

The Expo SDK 58 toolchain audit reports high-severity transitive advisories in `node-forge` (through `@expo/cli` and code-signing utilities) and Zod 3 (through the CLI). These are not resolved by the customer-flow work. `npm audit fix --force` suggests a downgrade to Expo 44 and was not applied. A breaking Zod 4 override was not forced into a CLI built against Zod 3.

Primary advisories:
- https://github.com/advisories/GHSA-86w9-cpqp-85rv — node-forge <=1.4.0; no patched version listed at review.
- https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 — Zod <4.6.6.

The native customer API uses Java validation; these packages enter through the build/development toolchain. That distinction does not make the advisories resolved. Keep the development server on trusted interfaces; do not enable untrusted OTA/code-signing workflows. Re-evaluate an upstream-compatible Expo fix before a production mobile release. Native Android/iOS bundle verification succeeds, but release signing and store/device verification remain outstanding.
