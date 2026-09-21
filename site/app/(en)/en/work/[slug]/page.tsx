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
  return c ? pageMetadata("en", { path: `work/${slug}`, title: `${c.name.en} — Elyoxe`, description: c.summary.en }) : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const c = bySlug(slug);
  if (!c) notFound();
  return (
    <>
      <JsonLd data={graph(caseStudy("en", c), breadcrumbs("en", [{ name: c.name.en, path: `work/${c.slug}` }]))} />
      <CasePage lang="en" c={c} />
    </>
  );
}
