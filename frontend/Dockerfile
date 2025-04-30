# 1) Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json .
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# 2) Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install a simple static server
RUN npm install -g serve

# Copy built assets
COPY --from=builder /app/dist ./dist

# Expose port (Cloud Run will route to this)
EXPOSE 8080

# Start the static server on port 8080
CMD ["serve", "-s", "dist", "-l", "8080"]