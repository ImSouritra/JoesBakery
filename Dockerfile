# Use official Node image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Set environment port (Cloud Run will set PORT)
ENV NODE_ENV=production
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
