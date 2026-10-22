/** Space and touch capabilities select the initial layout, never user-agent identity.
 * Short side keeps a phone in the same experience on rotation; tablets keep desktop.
 */
export function selectLayout({
  width,
  height,
  coarse,
  touchPoints,
  touchEvents = false,
}) {
  return Math.min(width, height) < 600 &&
    coarse &&
    (touchPoints > 0 || touchEvents)
    ? "phone"
    : "desktop";
}
