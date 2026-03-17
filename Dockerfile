FROM node:20-alpine AS build-client
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci --ignore-scripts 2>/dev/null || npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && (npm ci --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev)
COPY server/index.js ./server/
COPY --from=build-client /app/client/dist ./client/dist
COPY docker-entrypoint.sh /usr/local/bin/
RUN mkdir -p /app/data && chown -R node:node /app \
    && chmod +x /usr/local/bin/docker-entrypoint.sh \
    && apk add --no-cache su-exec
EXPOSE 3001
ENTRYPOINT ["docker-entrypoint.sh"]
