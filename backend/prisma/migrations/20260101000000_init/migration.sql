-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VIEWER');
CREATE TYPE "Strategy" AS ENUM ('BOOLEAN', 'PERCENTAGE_ROLLOUT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Environment" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Environment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Flag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "strategy" "Strategy" NOT NULL DEFAULT 'BOOLEAN',
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
    "constraints" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "environmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Flag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "flagKey" TEXT NOT NULL,
    "environmentKey" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Indexes & constraints
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Environment_key_key" ON "Environment"("key");
CREATE INDEX "Flag_environmentId_idx" ON "Flag"("environmentId");
CREATE UNIQUE INDEX "Flag_key_environmentId_key" ON "Flag"("key", "environmentId");
CREATE INDEX "AuditLog_flagKey_idx" ON "AuditLog"("flagKey");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- FKs
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
