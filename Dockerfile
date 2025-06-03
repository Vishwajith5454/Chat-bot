FROM node:18-slim

# 1) Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    libatk-1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    fonts-liberation \
    ca-certificates \
    wget \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2) Copy only package.json first, then install Node deps
COPY package.json ./
RUN npm install

# 3) Copy the rest of your code
COPY . .

CMD ["npm", "start"]
