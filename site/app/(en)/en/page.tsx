import Home from "@/components/Home";
import JsonLd from "@/components/JsonLd";
import { graph, organization, webSite } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";

// its Arabic twin is the studio page at /about/ since the Arabic root became the products portal (2026-10-09)
export const metadata = pageMetadata("en", { twin: "about" });

export default function Page() {
  return (
    <>
      <JsonLd data={graph(organization("en"), webSite("en"))} />
      <Home lang="en" />
    </>
  );
}
