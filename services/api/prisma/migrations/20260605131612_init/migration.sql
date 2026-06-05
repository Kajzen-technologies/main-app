-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ANONYMOUS', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'GOVERNMENT_VIEWER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "PublicStatus" AS ENUM ('OPEN', 'CLOSED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CrowdLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MarkerReportIssueType" AS ENUM ('CLOSED', 'NO_ELECTRICITY', 'NO_WATER', 'NO_INTERNET', 'TOO_CROWDED', 'WRONG_LOCATION', 'OUTDATED_INFO', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "type" "UserType" NOT NULL DEFAULT 'ANONYMOUS',
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "localUserId" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'cs',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marker" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "publicStatus" "PublicStatus" NOT NULL DEFAULT 'UNKNOWN',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "hasElectricity" BOOLEAN,
    "hasWater" BOOLEAN,
    "hasInternet" BOOLEAN,
    "crowdLevel" "CrowdLevel" NOT NULL DEFAULT 'UNKNOWN',
    "submittedByLocalUserId" TEXT,
    "approvedByAdminId" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkerReport" (
    "id" TEXT NOT NULL,
    "markerId" TEXT NOT NULL,
    "localUserId" TEXT NOT NULL,
    "reportedStatus" "PublicStatus" NOT NULL DEFAULT 'UNKNOWN',
    "hasElectricity" BOOLEAN,
    "hasWater" BOOLEAN,
    "hasInternet" BOOLEAN,
    "crowdLevel" "CrowdLevel" NOT NULL DEFAULT 'UNKNOWN',
    "issueType" "MarkerReportIssueType" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarkerReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideTranslation" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideChecklistItem" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "textCs" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_localUserId_key" ON "User"("localUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GuideTranslation_guideId_language_key" ON "GuideTranslation"("guideId", "language");

-- AddForeignKey
ALTER TABLE "MarkerReport" ADD CONSTRAINT "MarkerReport_markerId_fkey" FOREIGN KEY ("markerId") REFERENCES "Marker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideTranslation" ADD CONSTRAINT "GuideTranslation_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideChecklistItem" ADD CONSTRAINT "GuideChecklistItem_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
