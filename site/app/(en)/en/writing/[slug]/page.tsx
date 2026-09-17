import { notFound } from "next/navigation";
import WritingPage from "@/components/WritingPage";
import { writing, pieceBySlug } from "@/content/writing";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;
export function generateStaticParams() { return writing.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const p = pieceBySlug(slug);
  return p ? pageMetadata("en", { path: `writing/${slug}`, title: `${p.title.en} — Elyoxe`, description: p.lead.en }) : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const p = pieceBySlug(slug);
  if (!p) notFound();
  return <WritingPage lang="en" p={p} />;
}
