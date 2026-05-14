import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

export const RED_POPUP_BACKGROUND = "#dc2626";
export const BLUE_POPUP_BACKGROUND = "#2563eb";

const POPUP_COLORS = {
  red: RED_POPUP_BACKGROUND,
  blue: BLUE_POPUP_BACKGROUND,
};

function getPopupHtmlPath() {
  return fileURLToPath(new URL("../popup.html", import.meta.url));
}

function getNextColor(currentColor) {
  return currentColor === "red" ? "blue" : "red";
}

export function togglePopupBuildColor(html) {
  const colorMatch = html.match(/data-build-color="(red|blue)"/);
  if (!colorMatch) {
    throw new Error('popup.html must include data-build-color="red" or "blue"');
  }

  const currentColor = colorMatch[1];
  const nextColor = getNextColor(currentColor);
  const currentBackground = POPUP_COLORS[currentColor];
  const nextBackground = POPUP_COLORS[nextColor];

  if (!html.includes(`background: ${currentBackground};`)) {
    throw new Error(
      `popup.html background does not match data-build-color="${currentColor}"`,
    );
  }

  return {
    color: nextColor,
    html: html
      .replace(/data-build-color="(red|blue)"/, `data-build-color="${nextColor}"`)
      .replace(
        `background: ${currentBackground};`,
        `background: ${nextBackground};`,
      ),
  };
}

export async function togglePopupBuildColorFile(path = getPopupHtmlPath()) {
  const html = await readFile(path, "utf8");
  const result = togglePopupBuildColor(html);
  await writeFile(path, result.html);
  return result.color;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const color = await togglePopupBuildColorFile();
  console.log(`Popup background changed to ${color}.`);
}
