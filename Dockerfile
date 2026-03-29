FROM node:18-slim

# Install Python 3 + pip
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python dependencies (install first for caching)
COPY server/pipeline/requirements.txt /app/server/pipeline/requirements.txt
RUN pip3 install --break-system-packages --no-cache-dir -r /app/server/pipeline/requirements.txt

# Node dependencies
COPY package*.json ./
RUN npm ci --production

# Copy app source
COPY . .

# Build React frontend
RUN npm run build

EXPOSE 3007

CMD ["node", "server/index.js"]
