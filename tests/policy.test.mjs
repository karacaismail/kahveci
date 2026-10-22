import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css = fs.readFileSync(
  new URL("../src/styles.css", import.meta.url),
  "utf8",
);
const ui = fs.readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const motion = fs.readFileSync(
  new URL("../src/motion.ts", import.meta.url),
  "utf8",
);
function withoutReduced(s) {
  const start = s.indexOf("@media (prefers-reduced-motion: reduce)");
  assert.ok(start >= 0);
  const brace = s.indexOf("{", start);
  let depth = 1,
    end = brace + 1;
  for (; depth && end < s.length; end++) {
    if (s[end] === "{") depth++;
    if (s[end] === "}") depth--;
  }
  return s.slice(0, start) + s.slice(end);
}
test("normal transitions only use central duration/easing and no entry-only overrides", () => {
  const normal =
    withoutReduced(css) +
    fs.readFileSync(new URL("../src/phone.css", import.meta.url), "utf8");
  for (const m of normal.matchAll(
    /(?:^|[;{}])\s*(transition(?:-duration|-timing-function)?|animation(?:-duration|-timing-function)?)\s*:\s*([^;{}]+)/g,
  )) {
    const [_, key, value] = m;
    assert.ok(
      !/\ball\b|\bease-in\b|\bease-out\b|\blinear\b|\bsteps\b|\b0ms\b|\b0s\b/.test(
        value,
      ),
      m[0],
    );
    if (key === "transition")
      assert.ok(
        value.includes("var(--motion-duration)") &&
          value.includes("var(--motion-easing)"),
        value,
      );
    if (key.endsWith("duration"))
      assert.ok(value.includes("var(--motion-duration)"), value);
    if (key.endsWith("timing-function"))
      assert.ok(value.includes("var(--motion-easing)"), value);
  }
  assert.ok(!/:hover\s*\{[^}]*transition\s*:/s.test(normal));
  assert.match(motion, /duration:\s*180/);
  assert.match(motion, /cubic-bezier\(\.65, 0, \.35, 1\)/);
  assert.ok(!ui.includes("setTimeout("));
});
test("modal and select adapters consume same motion tokens", () => {
  assert.match(ui, /duration:\s*motion.duration/);
  assert.match(ui, /timingFunction:\s*motion.easing/);
  assert.match(css, /mantine-Switch-thumb/);
  assert.match(css, /mantine-Combobox-dropdown/);
});

test("score disclosures use the central reciprocal Collapse adapter and immediate ARIA/inert state", () => {
  assert.match(ui, /transitionDuration=\{motion.duration\}/);
  assert.match(ui, /transitionTimingFunction=\{motion.easing\}/);
  assert.match(ui, /aria-hidden=\{!opened\}/);
  assert.match(ui, /inert=\{!opened\}/);
  assert.ok(!ui.includes("<details"));
});
