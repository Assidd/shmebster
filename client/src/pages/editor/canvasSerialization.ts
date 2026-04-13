import { FabricObject, type Canvas } from 'fabric';

const SERIALIZED_PROPERTIES = ['id', 'name'];
let isConfigured = false;

export function ensureFabricCustomProperties() {
  if (isConfigured) {
    return;
  }

  FabricObject.customProperties = Array.from(
    new Set([...FabricObject.customProperties, ...SERIALIZED_PROPERTIES]),
  );
  isConfigured = true;
}

export function serializeCanvas(canvas: Canvas): Record<string, unknown> {
  ensureFabricCustomProperties();
  return canvas.toObject(SERIALIZED_PROPERTIES) as Record<string, unknown>;
}

export function stringifyCanvas(canvas: Canvas): string {
  return JSON.stringify(serializeCanvas(canvas));
}
