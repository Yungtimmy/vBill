import { Providers } from "@/components/providers";

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
