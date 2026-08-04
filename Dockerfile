FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY scripts ./scripts
COPY src ./src
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine

USER root

COPY --chmod=644 nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chmod=644 /app/install-bookmarklet.html /usr/share/nginx/html/index.html
COPY --from=build --chmod=644 /app/install-bookmarklet.html /usr/share/nginx/html/install-bookmarklet.html
COPY --from=build --chmod=644 /app/bookmarklet.txt /usr/share/nginx/html/bookmarklet.txt

USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
