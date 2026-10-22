import test from "node:test";
import assert from "node:assert/strict";
import { selectLayout } from "../src/layout.mjs";
test("only compact touch screens select phone; rotation preserves profile", () => {
  for (const [width, height] of [
    [320, 640],
    [390, 844],
    [844, 390],
  ])
    assert.equal(
      selectLayout({ width, height, coarse: true, touchPoints: 5 }),
      "phone",
    );
  for (const props of [
    { width: 768, height: 1024, coarse: true, touchPoints: 5 },
    { width: 390, height: 844, coarse: false, touchPoints: 0 },
    { width: 1024, height: 1366, coarse: true, touchPoints: 5 },
  ])
    assert.equal(selectLayout(props), "desktop");
});

test("phone eligibility boundary keeps tablets at 600 and above on desktop", () => {
  for (const width of [599, 600, 601])
    assert.equal(
      selectLayout({ width, height: 900, coarse: true, touchPoints: 5 }),
      width < 600 ? "phone" : "desktop",
    );
});
