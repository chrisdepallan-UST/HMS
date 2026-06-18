# syntax=docker/dockerfile:1

# ---- Base image -------------------------------------------------------------
# Alpine keeps the image small; Node 20 LTS satisfies Express 5 / Mongoose 9.
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ---- Dependencies -----------------------------------------------------------
# Copy only the manifests first so this layer is cached unless deps change.
COPY package.json package-lock.json ./

# Install production deps only.
# --ignore-scripts is required: the "postinstall" hook runs the DB seeder
# (src/utils/seed.js), which needs a live MongoDB connection and would fail
# during the build. Seeding should run at deploy/runtime instead, not at build.
RUN npm ci --omit=dev --ignore-scripts

# ---- Application ------------------------------------------------------------
COPY . .

# Drop root privileges; the base image ships a "node" user.
USER node

# Matches PORT in src/server.js (defaults to 5000).
EXPOSE 5000

# Basic liveness check against the root route.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ || exit 1

CMD ["node", "src/server.js"]
