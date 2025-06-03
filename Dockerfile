# Dockerfile

# Use Node.js 18 LTS (slim) as base image
FROM node:18-slim

# Install OS dependencies required by Puppeteer (and therefore Venom.js)
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

# Create and set the working directory inside the container
WORKDIR /app

# 1) Copy only package.json (no package-lock.json)
#    This allows npm install to run based on package.json alone.
COPY package.json ./

# 2) Install dependencies
RUN npm install

# 3) Copy the rest of the application code into /app
#    (index.js, sheet.js, materials.json, credentials.json, etc.)
COPY . .

# 4) Expose no ports (we’re not running a web server)
#    Start the bot
CMD ["npm", "start"]
