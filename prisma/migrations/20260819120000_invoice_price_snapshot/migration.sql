ALTER TABLE "Invoice" ADD COLUMN "priceUsdAtCreation" DECIMAL(38,18);
ALTER TABLE "Invoice" ADD COLUMN "usdValueAtCreation" DECIMAL(38,18);
ALTER TABLE "Invoice" ADD COLUMN "minimumUsdAtCreation" DECIMAL(18,8);
ALTER TABLE "Invoice" ADD COLUMN "priceSource" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "priceFetchedAt" TIMESTAMP(3);
