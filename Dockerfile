FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci
COPY . .
ARG EXPO_PUBLIC_API_BASE_URL=https://api.aztrip.online
ARG EXPO_PUBLIC_WEB_ORIGIN=https://aztrip.online
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL \
    EXPO_PUBLIC_WEB_ORIGIN=$EXPO_PUBLIC_WEB_ORIGIN \
    CI=1
RUN npm run typecheck && npm run lint && npm test \
    && npx expo export --platform web --output-dir dist
FROM nginx:stable-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=6 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
