export type EffectType = "zoomIn" | "zoomOut" | "moveToLeft" | "moveToRight" | "moveToTop" | "moveToBottom";

export const EFFECT_TYPES: EffectType[] = [
  "zoomIn",
  "zoomOut",
  "moveToRight",
  "moveToLeft",
  "moveToTop",
  "moveToBottom",
];

const DEFAULT_ZOOM = 120;
const DEFAULT_DURATION = 5;
const DEFAULT_PAN_DISTANCE = 10;

export const effectDefaults = {
  zoom: DEFAULT_ZOOM,
  duration: DEFAULT_DURATION,
  panDistance: DEFAULT_PAN_DISTANCE,
};

export const isPanEffect = (effect: EffectType | null): boolean => {
  return effect === "moveToLeft" || effect === "moveToRight" || effect === "moveToTop" || effect === "moveToBottom";
};

const buildHtml = (imageSrc: string, effectType: EffectType): string[] => {
  if (isPanEffect(effectType)) {
    // Move effects: img covers viewport at natural aspect ratio.
    // min-width/min-height ensure the image always covers the viewport.
    // Panning animates left/top on the img to reveal hidden parts.
    return [
      "<div class='h-full w-full overflow-hidden relative bg-black'>",
      "  <div id='photo_wrap' style='position:absolute;inset:0'>",
      `    <img id='photo_img' src='${imageSrc}' style='position:absolute;min-width:100%;min-height:100%;width:auto;height:auto;top:50%;left:50%;transform:translate(-50%,-50%)' />`,
      "  </div>",
      "</div>",
    ];
  }
  return [
    "<div class='h-full w-full overflow-hidden relative bg-black'>",
    "  <div id='photo_wrap' style='position:absolute;inset:0;overflow:hidden'>",
    `    <img src='${imageSrc}' style='width:100%;height:100%;object-fit:cover' />`,
    "  </div>",
    "</div>",
  ];
};

const buildScript = (effectType: EffectType, zoom: number, panDistance: number): string[] => {
  const scale = zoom / 100;

  if (isPanEffect(effectType)) {
    const scaleParams = JSON.stringify({ scale: [scale, scale] });
    const moveParams = JSON.stringify(getMoveParams(effectType, panDistance));
    return [
      "const animation = new MulmoAnimation();",
      `animation.animate('#photo_wrap', ${scaleParams}, { start: 0, end: 'auto', easing: 'linear' });`,
      `animation.animate('#photo_img', ${moveParams}, { start: 0, end: 'auto', easing: 'linear' });`,
    ];
  }

  const animateParams = JSON.stringify(getZoomParams(effectType, scale));
  return [
    "const animation = new MulmoAnimation();",
    `animation.animate('#photo_wrap', ${animateParams}, { start: 0, end: 'auto', easing: 'linear' });`,
  ];
};

// Move effects: animate left/top on img from center (50%) toward the direction
const getMoveParams = (effectType: EffectType, panDistance: number): Record<string, (number | string)[]> => {
  switch (effectType) {
    case "moveToLeft":
      return { left: [50, 50 + panDistance, "%"] };
    case "moveToRight":
      return { left: [50, 50 - panDistance, "%"] };
    case "moveToTop":
      return { top: [50, 50 + panDistance, "%"] };
    case "moveToBottom":
      return { top: [50, 50 - panDistance, "%"] };
    default:
      return {};
  }
};

const getZoomParams = (effectType: EffectType, scale: number): Record<string, (number | string)[]> => {
  switch (effectType) {
    case "zoomIn":
      return { scale: [1.0, scale] };
    case "zoomOut":
      return { scale: [scale, 1.0] };
    default:
      return {};
  }
};

export const generateEffectTemplate = (
  effectType: EffectType,
  imageSrc: string,
  zoom: number,
  panDistance: number = effectDefaults.panDistance,
): { html: string[]; script: string[] } => {
  return {
    html: buildHtml(imageSrc, effectType),
    script: buildScript(effectType, zoom, panDistance),
  };
};

export const isTemplateMatch = (
  currentHtml: string | string[] | undefined,
  currentScript: string | string[] | undefined,
  effectType: EffectType,
  imageSrc: string,
  zoom: number,
  panDistance: number = effectDefaults.panDistance,
): boolean => {
  const template = generateEffectTemplate(effectType, imageSrc, zoom, panDistance);
  const htmlArr = Array.isArray(currentHtml) ? currentHtml : [currentHtml ?? ""];
  const scriptArr = Array.isArray(currentScript) ? currentScript : [currentScript ?? ""];
  return (
    JSON.stringify(htmlArr) === JSON.stringify(template.html) &&
    JSON.stringify(scriptArr) === JSON.stringify(template.script)
  );
};
