# Use official Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Expose port
EXPOSE 5002

# Start in dev mode (nodemon)
CMD ["node", "src/server.js"]