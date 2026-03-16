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
const DEFAULT_PAN_FROM = 0;
const DEFAULT_PAN_TO = 100;

export const effectDefaults = {
  zoom: DEFAULT_ZOOM,
  duration: DEFAULT_DURATION,
  panFrom: DEFAULT_PAN_FROM,
  panTo: DEFAULT_PAN_TO,
};

export const isPanEffect = (effect: EffectType | null): boolean => {
  return effect === "moveToLeft" || effect === "moveToRight" || effect === "moveToTop" || effect === "moveToBottom";
};

const buildHtml = (imageSrc: string): string[] => {
  // Shared layout for zoom/move effects. Cover helpers resize/move #photo_img per-frame.
  return [
    "<div style='position:absolute;inset:0;overflow:hidden;background:black'>",
    "  <div id='photo_wrap' style='position:absolute;inset:0'>",
    `    <img id='photo_img' src='${imageSrc}' style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);max-width:none;max-height:none' />`,
    "  </div>",
    "</div>",
  ];
};

export const getDefaultPanRange = (effectType: EffectType): { from: number; to: number } => {
  switch (effectType) {
    case "moveToLeft":
    case "moveToTop":
      return { from: 100, to: 0 };
    case "moveToRight":
    case "moveToBottom":
      return { from: 0, to: 100 };
    default:
      return { from: DEFAULT_PAN_FROM, to: DEFAULT_PAN_TO };
  }
};

const buildPanScript = (effectType: EffectType, scale: number, panFrom: number, panTo: number): string[] => {
  const axis = effectType === "moveToLeft" || effectType === "moveToRight" ? "x" : "y";
  const panOptions = JSON.stringify({
    axis,
    from: panFrom,
    to: panTo,
    zoom: scale,
    start: 0,
    end: "auto",
    easing: "linear",
  });
  return ["const animation = new MulmoAnimation();", `animation.coverPan('#photo_img', ${panOptions});`];
};

const buildZoomScript = (effectType: EffectType, scale: number): string[] => {
  const zoomFrom = effectType === "zoomOut" ? scale : 1.0;
  const zoomTo = effectType === "zoomOut" ? 1.0 : scale;
  const zoomOptions = JSON.stringify({
    zoomFrom,
    zoomTo,
    start: 0,
    end: "auto",
    easing: "linear",
  });
  return ["const animation = new MulmoAnimation();", `animation.coverZoom('#photo_img', ${zoomOptions});`];
};

const buildScript = (effectType: EffectType, zoom: number, panFrom: number, panTo: number): string[] => {
  const scale = zoom / 100;
  return isPanEffect(effectType)
    ? buildPanScript(effectType, scale, panFrom, panTo)
    : buildZoomScript(effectType, scale);
};

export const generateEffectTemplate = (
  effectType: EffectType,
  imageSrc: string,
  zoom: number,
  panFrom?: number,
  panTo?: number,
): { html: string[]; script: string[] } => {
  const defaults = getDefaultPanRange(effectType);
  return {
    html: buildHtml(imageSrc),
    script: buildScript(effectType, zoom, panFrom ?? defaults.from, panTo ?? defaults.to),
  };
};

export const isTemplateMatch = (
  currentHtml: string | string[] | undefined,
  currentScript: string | string[] | undefined,
  effectType: EffectType,
  imageSrc: string,
  zoom: number,
  panFrom?: number,
  panTo?: number,
): boolean => {
  const template = generateEffectTemplate(effectType, imageSrc, zoom, panFrom, panTo);
  const htmlArr = Array.isArray(currentHtml) ? currentHtml : [currentHtml ?? ""];
  const scriptArr = Array.isArray(currentScript) ? currentScript : [currentScript ?? ""];
  return (
    JSON.stringify(htmlArr) === JSON.stringify(template.html) &&
    JSON.stringify(scriptArr) === JSON.stringify(template.script)
  );
};
