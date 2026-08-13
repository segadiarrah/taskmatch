/**
 * Serialize a structured-data object for embedding in a `<script>` tag.
 *
 * The objects we embed are built from checked-in content modules, not from user
 * input, so this is not the last line of defence. It is still the correct way to
 * write it: `JSON.stringify` happily emits the literal characters `</script>` if
 * any string ever contains them, and the browser ends the script element there —
 * turning the rest of the document into markup. Escaping `<` closes that door
 * once, here, rather than relying on every future blog post not to mention a
 * closing tag.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
