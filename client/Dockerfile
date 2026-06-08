# ==============================================================================
# Stage 1: Build
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source files
COPY . .

# Build arguments for environment variables
ARG VITE_STRIPE_PUBLIC_KEY
ARG VITE_PAYSTACK_PUBLIC_KEY
ARG VITE_REDDIT_PIXEL_ID
ARG VITE_API_URL
ARG VITE_RAILS_API_URL
ARG VITE_WS_URL
ARG VITE_HUNDREDPAY_PUBLIC_KEY
ARG VITE_TAWK_PROPERTY_ID
ARG VITE_TAWK_WIDGET_ID

# Build the application
RUN npm run build

# ==============================================================================
# Stage 2: Production
# ==============================================================================
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
