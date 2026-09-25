# Production Dockerfile for Podhigai College Backend on Google Cloud Run
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests first for optimal layer caching
COPY package*.json ./

# Install only production dependencies cleanly via lockfile
RUN npm ci --only=production

# Copy backend application source code
COPY . .

# Set ownership to built-in non-root node user
RUN chown -R node:node /app

# Switch to non-root user for security
USER node

# Production environment variables (PORT is injected by Cloud Run; 8080 is standard default)
ENV NODE_ENV=production
ENV PORT=8080

# Cloud Run listens on PORT
EXPOSE 8080

# Start server
CMD ["node", "server.js"]
