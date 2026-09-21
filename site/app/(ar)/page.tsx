import Home from "@/components/Home";
import JsonLd from "@/components/JsonLd";
import { graph, organization, webSite } from "@/lib/jsonld";

export default function Page() {
  return (
    <>
      <JsonLd data={graph(organization("ar"), webSite("ar"))} />
      <Home lang="ar" />
    </>
  );
}
