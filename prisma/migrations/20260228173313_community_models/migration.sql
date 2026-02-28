-- CreateTable
CREATE TABLE "CommunityCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rank" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "scoreChange" REAL NOT NULL DEFAULT 0,
    "logo" TEXT NOT NULL,
    "employees" TEXT NOT NULL,
    "highlights" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CommunityRegion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "topCompany" TEXT NOT NULL,
    "companyCount" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "CommunityAchievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CommunityGlobalStats" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "globalScore" REAL NOT NULL,
    "scoreChange" REAL NOT NULL,
    "totalCompanies" INTEGER NOT NULL,
    "totalAssessments" INTEGER NOT NULL,
    "avgReadiness" REAL NOT NULL,
    "topIndustryScore" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "creatorCompanyId" TEXT NOT NULL,
    "greenFilter" TEXT NOT NULL DEFAULT 'all',
    "includeInternal" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "invitedCompanyIds" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "launchedAt" DATETIME,
    CONSTRAINT "Campaign_creatorCompanyId_fkey" FOREIGN KEY ("creatorCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityRegion_name_key" ON "CommunityRegion"("name");
