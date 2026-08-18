import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Footer } from "@/components/footer";
import { DocsSidebar } from "@/components/docs/sidebar";
import { DOC_SECTIONS, neighbors, sectionOf, type DocItem } from "@/content/docs";

function DocLink({ item, dir }: { item?: DocItem; dir: "prev" | "next" }) {
  if (!item) return <span className="hidden sm:block" />;
  return (
    <Link
      href={`/docs/${item.slug}`}
      className="group flex flex-col gap-1 rounded-2xl border border-line bg-card px-4 py-3 min-w-0"
    >
      <span className="text-xs text-muted">{dir === "prev" ? "Previous" : "Next"}</span>
      <span className="text-sm font-medium text-purple">{item.title}</span>
    </Link>
  );
}

export function DocsShell({
  slug,
  title,
  description,
  children,
}: {
  slug: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { prev, next } = neighbors(slug);
  const section = sectionOf(slug);

  return (
    <div className="min-h-screen flex flex-col bg-page-gradient text-ink">
      <PublicHeader />
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-5 sm:px-6 py-8 md:py-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted mb-6">
          <Link href="/docs" className="hover:text-ink">
            Documentation
          </Link>
          {section && (
            <>
              <span aria-hidden className="mx-2">
                /
              </span>
              <span>{section}</span>
            </>
          )}
          <span aria-hidden className="mx-2">
            /
          </span>
          <span className="text-ink">{title}</span>
        </nav>

        <div className="flex gap-10">
          <DocsSidebar sections={DOC_SECTIONS} current={slug} />

          <div className="flex-1 min-w-0">
            <article className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
              <p className="mt-2 text-muted text-[15px]">{description}</p>
              <div className="mt-8">{children}</div>
            </article>

            <div className="mt-12 grid grid-cols-2 gap-3 max-w-3xl">
              <DocLink item={prev} dir="prev" />
              <DocLink item={next} dir="next" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
