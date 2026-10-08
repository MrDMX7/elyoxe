import Home from "@/components/Home";
import JsonLd from "@/components/JsonLd";
import { graph, organization, webSite } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";

/* The studio page (services, work, approach, contact). It was the Arabic home until 2026-10-09,
   when the root became the products portal (components/Portal.tsx). */
export const metadata = pageMetadata("ar", { path: "about", title: "عن Elyoxe", twin: "" });

export default function Page() {
  return (
    <>
      <JsonLd data={graph(organization("ar"), webSite("ar"))} />
      <Home lang="ar" />
    </>
  );
}
