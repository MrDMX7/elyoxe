import { notFound } from "next/navigation";
import CasePage from "@/components/CasePage";
import { caseStudies, bySlug } from "@/content/case-studies";
import { pageMetadata } from "@/lib/metadata";
import JsonLd from "@/components/JsonLd";
import { graph, caseStudy, breadcrumbs } from "@/lib/jsonld";

export const dynamicParams = false;
export function generateStaticParams() { return caseStudies.map((c) => ({ slug: c.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const c = bySlug(slug);
  return c ? pageMetadata("ar", { path: `work/${slug}`, title: `${c.name.ar} — Elyoxe`, description: c.summary.ar }) : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const c = bySlug(slug);
  if (!c) notFound();
  return (
    <>
      <JsonLd data={graph(caseStudy("ar", c), breadcrumbs("ar", [{ name: c.name.ar, path: `work/${c.slug}` }]))} />
      <CasePage lang="ar" c={c} />
    </>
  );
}
