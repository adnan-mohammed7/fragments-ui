# Stage 0: Install Dependencies
FROM node:22-alpine@sha256:b2358485e3e33bc3a33114d2b1bdb18cdbe4df01bd2b257198eb51beb1f026c5 AS deps

WORKDIR /app

# Copy only package manifests to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

#######################################################################

# Stage 1: Build the app using Node.js and Parcel bundler
FROM node:22-alpine@sha256:b2358485e3e33bc3a33114d2b1bdb18cdbe4df01bd2b257198eb51beb1f026c5 AS build

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all app files
COPY . .

# Build the app
RUN npx parcel build index.html --dist-dir build --public-url ./

################################################################################################

# Stage 2: Serve built assets with nginx
FROM nginx:1.29.3-alpine@sha256:b3c656d55d7ad751196f21b7fd2e8d4da9cb430e32f646adcf92441b72f82b14

# Copy built static files from build stage
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

# Start nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]

HEALTHCHECK --interval=15s --timeout=30s --start-period=10s --retries=3 \
  CMD curl http://localhost/ || exit 1