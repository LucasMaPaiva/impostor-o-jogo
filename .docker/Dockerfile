# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build the front-end
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built assets and server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/palavras_dicas_1000(1).json ./

# Install tsx globally or as a dependency to run server.ts
RUN npm install -g tsx

EXPOSE 3000

# Run the server
CMD ["tsx", "server.ts"]
