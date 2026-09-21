import { notFound } from "next/navigation";
import WritingPage from "@/components/WritingPage";
import { writing, pieceBySlug } from "@/content/writing";
import { pageMetadata } from "@/lib/metadata";
import JsonLd from "@/components/JsonLd";
import { graph, article, breadcrumbs } from "@/lib/jsonld";

export const dynamicParams = false;
export function generateStaticParams() { return writing.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const p = pieceBySlug(slug);
  return p ? pageMetadata("ar", { path: `writing/${slug}`, title: `${p.title.ar} — Elyoxe`, description: p.lead.ar }) : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const p = pieceBySlug(slug);
  if (!p) notFound();
  return (
    <>
      <JsonLd data={graph(article("ar", p), breadcrumbs("ar", [{ name: p.title.ar, path: `writing/${p.slug}` }]))} />
      <WritingPage lang="ar" p={p} />
    </>
  );
}
