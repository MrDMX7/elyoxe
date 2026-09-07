import NotFoundPage from "@/components/NotFoundPage";
import { pageMetadata } from "@/lib/metadata";
import { copy } from "@/content/copy";
export const metadata = { ...pageMetadata("ar", { path: "404", title: `${copy.notFound.title.ar} — Elyoxe` }), robots: { index: false, follow: false } };
export default function Page() { return <NotFoundPage lang="ar" />; }
