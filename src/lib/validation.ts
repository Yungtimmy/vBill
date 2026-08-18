import { z } from "zod";
import { isAddress, isHash } from "viem";

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_NOTE = 2000;
const MAX_DESC = 240;

export const emailSchema = z
  .string()
  .trim()
  .max(MAX_EMAIL)
  .email()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const requiredEmailSchema = z.string().trim().max(MAX_EMAIL).email();

export const addressSchema = z
  .string()
  .trim()
  .refine((v) => isAddress(v, { strict: false }), "Invalid wallet address.");

export const txHashSchema = z
  .string()
  .trim()
  .refine((v) => isHash(v), "Invalid transaction hash.");

export const amountSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Amount must be a positive decimal.")
  .refine((v) => v !== "0" && v !== "0.0" && !/^0+(\.0+)?$/.test(v), "Amount must be greater than zero.");

export const quantitySchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Quantity must be a positive integer.")
  .refine((v) => BigInt(v) > 0n, "Quantity must be greater than zero.");

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1).max(MAX_DESC),
  quantity: quantitySchema,
  unitPrice: amountSchema,
});

export const createInvoiceSchema = z
  .object({
    customerName: z.string().trim().min(1).max(MAX_NAME),
    customerEmail: emailSchema,
    items: z.array(invoiceItemSchema).min(1).max(50),
    dueDate: z.string().datetime().optional().or(z.literal("").transform(() => undefined)),
    notes: z.string().trim().max(MAX_NOTE).optional(),
    publish: z.boolean().optional(),
  })
  .strict();

export const updateDraftInvoiceSchema = z
  .object({
    customerName: z.string().trim().min(1).max(MAX_NAME).optional(),
    customerEmail: emailSchema,
    items: z.array(invoiceItemSchema).min(1).max(50).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    notes: z.string().trim().max(MAX_NOTE).nullable().optional(),
  })
  .strict();

export const createCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_NAME),
    email: emailSchema,
  })
  .strict();

export const updateCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_NAME).optional(),
    email: emailSchema,
  })
  .strict();

export const updateSettingsSchema = z
  .object({
    businessName: z.string().trim().min(1).max(MAX_NAME).optional(),
    businessEmail: emailSchema,
    logo: z
      .string()
      .trim()
      .max(600_000, "Logo image is too large.")
      .refine((v) => v === "" || v.startsWith("data:image/"), "Logo must be an image file.")
      .optional(),
  })
  .strict();

export const updateWalletSchema = z
  .object({
    walletAddress: addressSchema,
  })
  .strict();

export const submitPaymentSchema = z
  .object({
    txHash: txHashSchema,
    fromAddress: addressSchema.optional(),
  })
  .strict();

export const bootstrapSchema = z
  .object({
    walletAddress: addressSchema.optional(),
    email: emailSchema,
    businessName: z.string().trim().max(MAX_NAME).optional(),
  })
  .strict();

export const invoiceListQuerySchema = z.object({
  status: z
    .enum([
      "ALL",
      "DRAFT",
      "PENDING",
      "PROCESSING",
      "PAID",
      "UNDERPAID",
      "OVERPAID",
      "EXPIRED",
      "CANCELLED",
      "FAILED",
    ])
    .optional(),
  cursor: z.string().cuid().optional(),
  take: z.coerce.number().int().min(1).max(50).optional(),
});

export const publicIdSchema = z
  .string()
  .regex(/^[a-f0-9]{36}$/, "Invalid invoice link.");
