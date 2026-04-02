# 1. Base Layer
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# 2. Dependencies
FROM base AS deps
RUN npm ci
# Generate Prisma Client (crucial for MongoDB runtime)
RUN npx prisma generate

# 3. Build
FROM deps AS builder
COPY . .
RUN npm run build

# 4. Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only production essentials
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
# Copy schema for runtime prisma engine if needed
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start"]