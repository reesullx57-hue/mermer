-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'DEALER', 'ADMIN');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PRODUCTION', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "dealerId" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "discountRate" DECIMAL(12,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoneBrand" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoneBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoneCollection" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoneCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stone" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "collectionId" TEXT,
    "code" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoneColor" (
    "id" TEXT NOT NULL,
    "stoneId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "m2Price" DECIMAL(12,2) NOT NULL,
    "wastePercent" DECIMAL(12,4),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoneColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thickness" (
    "id" TEXT NOT NULL,
    "cm" INTEGER NOT NULL,
    "nameTr" TEXT NOT NULL,
    "coefficient" DECIMAL(12,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thickness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "coefficient" DECIMAL(12,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdgeType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "coefficient" DECIMAL(12,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EdgeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accessory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accessory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "value" DECIMAL(12,4) NOT NULL,
    "unit" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL DEFAULT '',
    "fee" DECIMAL(12,2) NOT NULL,
    "installAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "rate" DECIMAL(12,4),
    "amount" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "vatRate" DECIMAL(12,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuration" (
    "id" TEXT NOT NULL,
    "stoneColorId" TEXT NOT NULL,
    "thicknessId" TEXT NOT NULL,
    "formTypeId" TEXT NOT NULL,
    "edgeTypeId" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "sinkType" TEXT,
    "sinkHoles" INTEGER NOT NULL DEFAULT 0,
    "cooktopHole" BOOLEAN NOT NULL DEFAULT false,
    "skirtingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "skirtingHeightCm" INTEGER,
    "trimEnabled" BOOLEAN NOT NULL DEFAULT false,
    "trimModel" TEXT,
    "panelled" BOOLEAN NOT NULL DEFAULT false,
    "sideBoxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sideBoxSizeCm" INTEGER,
    "install" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "dealerId" TEXT,
    "configurationId" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "subtotalExVat" DECIMAL(12,2) NOT NULL,
    "dealerDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountId" TEXT,
    "promoDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatAmount" DECIMAL(12,2) NOT NULL,
    "totalInclVat" DECIMAL(12,2) NOT NULL,
    "pricingSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitPrice" DECIMAL(12,4) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "userId" TEXT,
    "dealerId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "totalInclVat" DECIMAL(12,2) NOT NULL,
    "pricingSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_code_key" ON "Dealer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StoneBrand_code_key" ON "StoneBrand"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StoneCollection_brandId_code_key" ON "StoneCollection"("brandId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Stone_code_key" ON "Stone"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StoneColor_stoneId_code_key" ON "StoneColor"("stoneId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Thickness_cm_key" ON "Thickness"("cm");

-- CreateIndex
CREATE UNIQUE INDEX "FormType_code_key" ON "FormType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EdgeType_code_key" ON "EdgeType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Accessory_code_key" ON "Accessory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PriceRule_code_key" ON "PriceRule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingZone_city_district_key" ON "ShippingZone"("city", "district");

-- CreateIndex
CREATE UNIQUE INDEX "Discount_code_key" ON "Discount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TaxConfig_code_key" ON "TaxConfig"("code");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoneCollection" ADD CONSTRAINT "StoneCollection_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "StoneBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stone" ADD CONSTRAINT "Stone_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "StoneBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stone" ADD CONSTRAINT "Stone_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "StoneCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoneColor" ADD CONSTRAINT "StoneColor_stoneId_fkey" FOREIGN KEY ("stoneId") REFERENCES "Stone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_stoneColorId_fkey" FOREIGN KEY ("stoneColorId") REFERENCES "StoneColor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_thicknessId_fkey" FOREIGN KEY ("thicknessId") REFERENCES "Thickness"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_formTypeId_fkey" FOREIGN KEY ("formTypeId") REFERENCES "FormType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_edgeTypeId_fkey" FOREIGN KEY ("edgeTypeId") REFERENCES "EdgeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configuration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
