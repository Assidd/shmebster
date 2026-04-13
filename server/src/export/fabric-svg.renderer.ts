function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function buildStyle(object: Record<string, unknown>): string {
  const fill = typeof object.fill === 'string' && object.fill.length > 0 ? object.fill : 'none';
  const stroke =
    typeof object.stroke === 'string' && object.stroke.length > 0 ? object.stroke : 'none';
  const strokeWidth = toNumber(object.strokeWidth, 0);
  const opacity = toNumber(object.opacity, 1);

  return [
    `fill="${escapeXml(fill)}"`,
    `stroke="${escapeXml(stroke)}"`,
    `stroke-width="${strokeWidth}"`,
    `opacity="${opacity}"`,
  ].join(' ');
}

function buildTransform(object: Record<string, unknown>): string {
  const left = toNumber(object.left, 0);
  const top = toNumber(object.top, 0);
  const angle = toNumber(object.angle, 0);
  const scaleX = toNumber(object.scaleX, 1);
  const scaleY = toNumber(object.scaleY, 1);

  const transforms = [`translate(${left} ${top})`];
  if (angle !== 0) {
    transforms.push(`rotate(${angle})`);
  }
  if (scaleX !== 1 || scaleY !== 1) {
    transforms.push(`scale(${scaleX} ${scaleY})`);
  }

  return transforms.length > 0 ? ` transform="${transforms.join(' ')}"` : '';
}

function renderTextbox(object: Record<string, unknown>): string {
  const text = typeof object.text === 'string' ? object.text : '';
  const fontSize = toNumber(object.fontSize, 24);
  const fontFamily =
    typeof object.fontFamily === 'string' && object.fontFamily.length > 0
      ? object.fontFamily
      : 'Arial';
  const fontWeight =
    typeof object.fontWeight === 'string' && object.fontWeight.length > 0
      ? object.fontWeight
      : 'normal';
  const fontStyle =
    typeof object.fontStyle === 'string' && object.fontStyle.length > 0
      ? object.fontStyle
      : 'normal';
  const textAlign =
    typeof object.textAlign === 'string' && object.textAlign.length > 0
      ? object.textAlign
      : 'left';
  const width = toNumber(object.width, 0);
  const lineHeight = toNumber(object.lineHeight, 1.16);
  const textAnchor =
    textAlign === 'center' ? 'middle' : textAlign === 'right' ? 'end' : 'start';
  const x = textAlign === 'center' ? width / 2 : textAlign === 'right' ? width : 0;

  const lines = text.split('\n');
  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : fontSize * lineHeight;
      return `<tspan x="${x}" dy="${dy}">${escapeXml(line || ' ')}</tspan>`;
    })
    .join('');

  return `<text x="${x}" y="${fontSize}" font-size="${fontSize}" font-family="${escapeXml(fontFamily)}" font-weight="${escapeXml(fontWeight)}" font-style="${escapeXml(fontStyle)}" text-anchor="${textAnchor}" ${buildStyle(object)}${buildTransform(object)}>${tspans}</text>`;
}

function renderPath(object: Record<string, unknown>): string {
  const commands = Array.isArray(object.path) ? object.path : [];
  const d = commands
    .map((command) => {
      if (!Array.isArray(command) || command.length === 0) {
        return '';
      }

      return command
        .map((part) => (typeof part === 'number' ? Number(part.toFixed(2)) : String(part)))
        .join(' ');
    })
    .join(' ')
    .trim();

  return `<path d="${escapeXml(d)}" ${buildStyle(object)}${buildTransform(object)} />`;
}

function renderObject(object: Record<string, unknown>): string {
  if (object.visible === false) {
    return '';
  }

  switch (object.type) {
    case 'rect': {
      const width = toNumber(object.width, 0);
      const height = toNumber(object.height, 0);
      const rx = toNumber(object.rx, 0);
      const ry = toNumber(object.ry, 0);
      return `<rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" ry="${ry}" ${buildStyle(object)}${buildTransform(object)} />`;
    }
    case 'circle': {
      const radius = toNumber(object.radius, 0);
      return `<circle cx="${radius}" cy="${radius}" r="${radius}" ${buildStyle(object)}${buildTransform(object)} />`;
    }
    case 'triangle': {
      const width = toNumber(object.width, 0);
      const height = toNumber(object.height, 0);
      return `<polygon points="0,${height} ${width / 2},0 ${width},${height}" ${buildStyle(object)}${buildTransform(object)} />`;
    }
    case 'line': {
      const x1 = toNumber(object.x1, 0);
      const y1 = toNumber(object.y1, 0);
      const x2 = toNumber(object.x2, 0);
      const y2 = toNumber(object.y2, 0);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${buildStyle(object)}${buildTransform(object)} />`;
    }
    case 'textbox':
    case 'i-text':
      return renderTextbox(object);
    case 'path':
      return renderPath(object);
    case 'image': {
      const src = typeof object.src === 'string' ? object.src : '';
      const width = toNumber(object.width, 0);
      const height = toNumber(object.height, 0);
      return `<image href="${escapeXml(src)}" width="${width}" height="${height}" preserveAspectRatio="none"${buildTransform(object)} />`;
    }
    default:
      return '';
  }
}

export function renderFabricCanvasToSvg(
  canvasData: Record<string, unknown>,
  width: number,
  height: number,
): string {
  const background =
    typeof canvasData.background === 'string' && canvasData.background.length > 0
      ? canvasData.background
      : '#ffffff';
  const objects = Array.isArray(canvasData.objects)
    ? canvasData.objects.filter((value): value is Record<string, unknown> => typeof value === 'object' && value !== null)
    : [];

  const markup = objects.map(renderObject).join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect x="0" y="0" width="${width}" height="${height}" fill="${escapeXml(background)}" />`,
    markup,
    '</svg>',
  ].join('');
}
