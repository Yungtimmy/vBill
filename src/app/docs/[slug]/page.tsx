import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DOC_PAGES } from "@/content/docs";
import { DocsShell } from "@/components/docs/docs-shell";
import { Blocks } from "@/components/docs/blocks";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = DOC_PAGES[slug];
  if (!page) return {};
  return {
    title: `${page.title} — VerseBill Documentation`,
    description: page.description,
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = DOC_PAGES[slug];
  if (!page) notFound();

  return (
    <DocsShell slug={slug} title={page.title} description={page.description}>
      <Blocks blocks={page.blocks} />
    </DocsShell>
  );
}
