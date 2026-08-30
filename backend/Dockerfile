# Reliable single-stage image. Prod size can be trimmed with a multi-stage build;
# for a reviewable demo we favour a build that "just runs".
FROM node:22-slim

WORKDIR /app

# Prisma needs openssl at runtime.
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build \
 && npx tsc prisma/seed.ts --outDir dist-seed --esModuleInterop --skipLibCheck \
      --module commonjs --target ES2021 --moduleResolution node \
      --experimentalDecorators --emitDecoratorMetadata

EXPOSE 3001

# Apply migrations, seed demo data (idempotent upserts), then start the API.
# The compiled entrypoint is dist/main.js; we fall back to dist/src/main.js so the
# container starts regardless of how the TypeScript output tree is laid out.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist-seed/seed.js && node $(test -f dist/main.js && echo dist/main.js || echo dist/src/main.js)"]
