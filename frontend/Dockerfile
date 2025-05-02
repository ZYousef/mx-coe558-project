FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

# Copy package files and install production dependencies
COPY --from=builder /app/package*.json ./
RUN npm install --only=production

# Copy built frontend and server script
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

EXPOSE 3000

# Run the Express proxy + static server
CMD ["node", "server.js"]