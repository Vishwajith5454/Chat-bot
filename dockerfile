# Use the official Node.js 18 image as a base
FROM node:18-slim

# Install dependencies needed by Chromium (for Venom.js)
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Create and set the working directory
WORKDIR /app

# Copy package files first (for caching) and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose no ports (Venom uses headless Chrome—no HTTP port required)
# If you ever add an HTTP health-check endpoint, expose it here:
# EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
