export function isPrivyConfigured(): boolean {
  const id = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  return Boolean(id && id !== "unconfigured" && id.length > 10);
}
