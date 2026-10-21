# Stage 1: Build Frontend SPA
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server application source code
COPY server/ ./

# Copy built frontend assets into location where app.js serves it
COPY --from=client-builder /app/client/dist /app/client/dist

# Ensure upload directory exists
RUN mkdir -p /app/server/uploads

EXPOSE 5000

CMD ["node", "src/server.js"]
