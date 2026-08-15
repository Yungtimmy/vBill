import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export async function listCustomers(merchantId: string) {
  return prisma.customer.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomer(
  merchantId: string,
  input: { name: string; email?: string },
) {
  return prisma.customer.create({
    data: {
      merchantId,
      name: input.name,
      email: input.email ?? null,
    },
  });
}

export async function getOwnedCustomer(merchantId: string, customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { invoices: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!customer) throw new NotFoundError();
  if (customer.merchantId !== merchantId) throw new ForbiddenError();
  return customer;
}

export async function updateCustomer(
  merchantId: string,
  customerId: string,
  input: { name?: string; email?: string },
) {
  await getOwnedCustomer(merchantId, customerId);
  return prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email ?? null } : {}),
    },
  });
}
