import Portal from "@/components/Portal";
import JsonLd from "@/components/JsonLd";
import { graph, organization, webSite } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { readPulse } from "@/lib/pulse";

/* The products portal (2026-10-09). The studio page that was here is at /about/. */
export const metadata = pageMetadata("ar", {
  title: "Elyoxe — سينما، أدوات، تيفو، الميلس",
  description: "استوديو إماراتي صغير وأربعة منتجات شغّالة: مواعيد السينما وأسعارها، أدوات مجانية بالعربي، نتايج الكورة، وغرف صوت.",
});

export default async function Page() {
  const pulse = await readPulse();
  return (
    <>
      <JsonLd data={graph(organization("ar"), webSite("ar"))} />
      <Portal pulse={pulse} />
    </>
  );
}
