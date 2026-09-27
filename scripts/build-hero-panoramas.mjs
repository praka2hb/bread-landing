import sharp from "sharp";
import { fileURLToPath } from "node:url";

const PANEL_WIDTH = 1536;
const PANEL_HEIGHT = 1024;
const OVERLAP = 384;
const STEP = PANEL_WIDTH - OVERLAP;

const publicPath = new URL("../public/", import.meta.url);

function publicFile(filename) {
  return fileURLToPath(new URL(filename, publicPath));
}

async function readPanel(filename) {
  const { data, info } = await sharp(publicFile(filename))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== PANEL_WIDTH || info.height !== PANEL_HEIGHT) {
    throw new Error(`${filename} must be ${PANEL_WIDTH}x${PANEL_HEIGHT}`);
  }

  return data;
}

function warpVertically(source, shift, horizon) {
  if (shift === 0) return source;

  const destination = Buffer.alloc(source.length);
  const shiftedHorizon = horizon + shift;
  const lastY = PANEL_HEIGHT - 1;

  for (let y = 0; y < PANEL_HEIGHT; y += 1) {
    const sourceY =
      y <= shiftedHorizon
        ? (y * horizon) / shiftedHorizon
        : horizon +
          ((y - shiftedHorizon) * (lastY - horizon)) /
            (lastY - shiftedHorizon);
    const lowY = Math.max(0, Math.min(lastY, Math.floor(sourceY)));
    const highY = Math.min(lastY, lowY + 1);
    const mix = sourceY - lowY;

    for (let x = 0; x < PANEL_WIDTH; x += 1) {
      const destinationOffset = (y * PANEL_WIDTH + x) * 4;
      const lowOffset = (lowY * PANEL_WIDTH + x) * 4;
      const highOffset = (highY * PANEL_WIDTH + x) * 4;

      for (let channel = 0; channel < 4; channel += 1) {
        destination[destinationOffset + channel] = Math.round(
          source[lowOffset + channel] * (1 - mix) +
            source[highOffset + channel] * mix,
        );
      }
    }
  }

  return destination;
}

function cleanGrassAlpha(source) {
  const cleaned = Buffer.from(source);

  for (let x = 0; x < PANEL_WIDTH; x += 1) {
    let horizon = 0;

    while (
      horizon < PANEL_HEIGHT - 1 &&
      source[(horizon * PANEL_WIDTH + x) * 4 + 3] < 128
    ) {
      horizon += 1;
    }

    for (let y = 0; y < PANEL_HEIGHT; y += 1) {
      const offset = (y * PANEL_WIDTH + x) * 4;

      if (y < horizon - 1) {
        cleaned[offset] = 0;
        cleaned[offset + 1] = 0;
        cleaned[offset + 2] = 0;
        cleaned[offset + 3] = 0;
      } else if (y === horizon - 1) {
        const edgeOffset = (horizon * PANEL_WIDTH + x) * 4;
        cleaned[offset] = source[edgeOffset];
        cleaned[offset + 1] = source[edgeOffset + 1];
        cleaned[offset + 2] = source[edgeOffset + 2];
        cleaned[offset + 3] = 72;
      } else if (y === horizon) {
        cleaned[offset + 3] = Math.max(192, cleaned[offset + 3]);
      } else {
        cleaned[offset + 3] = 255;
      }
    }
  }

  return cleaned;
}

function smoothStep(value) {
  return value * value * (3 - 2 * value);
}

function getHorizons(panel) {
  const horizons = new Uint16Array(PANEL_WIDTH);

  for (let x = 0; x < PANEL_WIDTH; x += 1) {
    let y = 0;
    while (
      y < PANEL_HEIGHT - 1 &&
      panel[(y * PANEL_WIDTH + x) * 4 + 3] < 128
    ) {
      y += 1;
    }
    horizons[x] = y;
  }

  return horizons;
}

function stitchPanels(panels, { landscape = false } = {}) {
  const outputWidth = PANEL_WIDTH + STEP * (panels.length - 1);
  const output = Buffer.alloc(outputWidth * PANEL_HEIGHT * 4);
  const horizons = landscape ? panels.map(getHorizons) : null;

  for (let panelIndex = 0; panelIndex < panels.length; panelIndex += 1) {
    const panel = panels[panelIndex];
    const panelLeft = panelIndex * STEP;

    for (let y = 0; y < PANEL_HEIGHT; y += 1) {
      for (let x = 0; x < PANEL_WIDTH; x += 1) {
        const sourceOffset = (y * PANEL_WIDTH + x) * 4;
        const destinationOffset = (y * outputWidth + panelLeft + x) * 4;

        if (panelIndex === 0 || x >= OVERLAP) {
          panel.copy(output, destinationOffset, sourceOffset, sourceOffset + 4);
          continue;
        }

        const amount = smoothStep(x / (OVERLAP - 1));

        if (landscape && horizons) {
          const previousPanel = panels[panelIndex - 1];
          const previousX = STEP + x;
          const previousHorizon = horizons[panelIndex - 1][previousX];
          const currentHorizon = horizons[panelIndex][x];
          const blendedHorizon = Math.round(
            previousHorizon * (1 - amount) + currentHorizon * amount,
          );

          if (y < blendedHorizon - 1) {
            output[destinationOffset] = 0;
            output[destinationOffset + 1] = 0;
            output[destinationOffset + 2] = 0;
            output[destinationOffset + 3] = 0;
            continue;
          }

          const previousY = Math.max(
            0,
            Math.min(
              PANEL_HEIGHT - 1,
              previousHorizon + y - blendedHorizon,
            ),
          );
          const currentY = Math.max(
            0,
            Math.min(
              PANEL_HEIGHT - 1,
              currentHorizon + y - blendedHorizon,
            ),
          );
          const previousOffset =
            (previousY * PANEL_WIDTH + previousX) * 4;
          const currentOffset = (currentY * PANEL_WIDTH + x) * 4;

          for (let channel = 0; channel < 3; channel += 1) {
            output[destinationOffset + channel] = Math.round(
              previousPanel[previousOffset + channel] * (1 - amount) +
                panel[currentOffset + channel] * amount,
            );
          }
          output[destinationOffset + 3] =
            y === blendedHorizon - 1
              ? 72
              : y === blendedHorizon
                ? 192
                : 255;
          continue;
        }

        const previousAlpha = output[destinationOffset + 3] / 255;
        const currentAlpha = panel[sourceOffset + 3] / 255;
        const alpha = previousAlpha * (1 - amount) + currentAlpha * amount;

        for (let channel = 0; channel < 3; channel += 1) {
          const premultiplied =
            output[destinationOffset + channel] * previousAlpha * (1 - amount) +
            panel[sourceOffset + channel] * currentAlpha * amount;
          output[destinationOffset + channel] =
            alpha === 0 ? 0 : Math.round(premultiplied / alpha);
        }

        output[destinationOffset + 3] = Math.round(alpha * 255);
      }
    }
  }

  return { data: output, width: outputWidth };
}

async function writePanorama({
  files,
  output,
  warps = [],
  cleanGrass = false,
}) {
  const panels = await Promise.all(files.map(readPanel));
  const preparedPanels = panels.map((panel, index) => {
    const cleanedPanel = cleanGrass ? cleanGrassAlpha(panel) : panel;
    const warp = warps[index];
    return warp
      ? warpVertically(cleanedPanel, warp.shift, warp.horizon)
      : cleanedPanel;
  });
  const panorama = stitchPanels(preparedPanels, { landscape: cleanGrass });

  await sharp(panorama.data, {
    raw: {
      width: panorama.width,
      height: PANEL_HEIGHT,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(publicFile(output));
}

await Promise.all([
  writePanorama({
    files: [
      "hero-grass-far-left-v1.png",
      "hero-grass-left-v1.png",
      "hero-grass-v5.png",
      "hero-grass-right-v1.png",
      "hero-grass-far-right-v1.png",
    ],
    output: "hero-grass-panorama-v2.png",
    cleanGrass: true,
    // Match each generated hill edge while leaving the approved center panel unwarped.
    warps: [
      { shift: -12, horizon: 472 },
      { shift: -23, horizon: 504 },
      null,
      { shift: 164, horizon: 521 },
      { shift: 134, horizon: 595 },
    ],
  }),
  writePanorama({
    files: [
      "hero-clouds-far-left-v1.png",
      "hero-clouds-left-v1.png",
      "hero-clouds-v4.png",
      "hero-clouds-right-v1.png",
      "hero-clouds-far-right-v1.png",
    ],
    output: "hero-clouds-panorama-v2.png",
  }),
]);
