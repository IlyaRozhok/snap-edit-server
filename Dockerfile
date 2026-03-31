FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# --- runtime stage ---
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && \
    npm install --os=linux --cpu=x64 sharp

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main.js"]
