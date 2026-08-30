FROM node:22-slim
WORKDIR /app

# NEXT_PUBLIC_* is inlined at build time. The browser runs on the host, so it
# reaches the backend via the host-published port, not the compose network name.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
