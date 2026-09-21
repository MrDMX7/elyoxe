/* One script tag, server-rendered into the static export. No client JavaScript: the
   crawler reads it out of the HTML, so shipping a component that hydrates would cost
   bytes for nothing. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // The payload is our own content, not user input, and JSON.stringify escapes the
      // quotes. The "<" is escaped anyway so a title containing "</script>" cannot end
      // the tag early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
