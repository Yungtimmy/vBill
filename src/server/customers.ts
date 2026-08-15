import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export type DerivedCustomer = {
  id: string;
  name: string;
  email: string | null;
  invoices?: { id: string; invoiceNumber: string; status: string }[];
};

function customerId(name: string, email: string | null): string {
  return createHash("sha256").update(`${name}\0${email ?? ""}`).digest("hex").slice(0, 24);
}

export async function listCustomers(merchantId: string): Promise<DerivedCustomer[]> {
  const invoices = await prisma.invoice.findMany({
    where: { merchantId },
    select: { customerName: true, customerEmail: true },
    orderBy: { createdAt: "desc" },
  });
  const seen = new Map<string, DerivedCustomer>();
  for (const inv of invoices) {
    const id = customerId(inv.customerName, inv.customerEmail);
    if (!seen.has(id)) {
      seen.set(id, { id, name: inv.customerName, email: inv.customerEmail });
    }
  }
  return [...seen.values()];
}

export async function createCustomer(
  _merchantId: string,
  input: { name: string; email?: string },
): Promise<DerivedCustomer> {
  return {
    id: customerId(input.name, input.email ?? null),
    name: input.name,
    email: input.email ?? null,
  };
}

export async function getOwnedCustomer(
  merchantId: string,
  id: string,
): Promise<DerivedCustomer> {
  const invoices = await prisma.invoice.findMany({
    where: { merchantId },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      customerName: true,
      customerEmail: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const match = invoices.filter(
    (inv) => customerId(inv.customerName, inv.customerEmail) === id,
  );
  if (match.length === 0) throw new NotFoundError();
  const first = match[0]!;
  return {
    id,
    name: first.customerName,
    email: first.customerEmail,
    invoices: match.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
    })),
  };
}

export async function updateCustomer(
  merchantId: string,
  id: string,
  input: { name?: string; email?: string },
): Promise<DerivedCustomer> {
  const current = await getOwnedCustomer(merchantId, id);
  const nextName = input.name ?? current.name;
  const nextEmail = input.email !== undefined ? input.email ?? null : current.email;
  await prisma.invoice.updateMany({
    where: { merchantId, customerName: current.name, customerEmail: current.email },
    data: { customerName: nextName, customerEmail: nextEmail },
  });
  return {
    id: customerId(nextName, nextEmail),
    name: nextName,
    email: nextEmail,
  };
}
