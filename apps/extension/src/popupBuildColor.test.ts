import { describe, expect, it } from "vitest";
import {
  BLUE_POPUP_BACKGROUND,
  RED_POPUP_BACKGROUND,
  togglePopupBuildColor,
} from "../scripts/togglePopupBuildColor.mjs";

describe("popup build color", () => {
  it("toggles the popup background from red to blue", () => {
    const html = `
      <body data-build-color="red">
        <style>
          body {
            background: ${RED_POPUP_BACKGROUND};
          }
        </style>
      </body>
    `;

    expect(togglePopupBuildColor(html).html).toContain(
      `background: ${BLUE_POPUP_BACKGROUND};`,
    );
  });

  it("toggles the popup background from blue to red", () => {
    const html = `
      <body data-build-color="blue">
        <style>
          body {
            background: ${BLUE_POPUP_BACKGROUND};
          }
        </style>
      </body>
    `;

    expect(togglePopupBuildColor(html).html).toContain(
      `background: ${RED_POPUP_BACKGROUND};`,
    );
  });
});
