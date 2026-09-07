import NotFoundPage from "@/components/NotFoundPage";
import { pageMetadata } from "@/lib/metadata";
import { copy } from "@/content/copy";
export const metadata = { ...pageMetadata("en", { path: "404", title: `${copy.notFound.title.en} — Elyoxe` }), robots: { index: false, follow: false } };
export default function Page() { return <NotFoundPage lang="en" />; }
