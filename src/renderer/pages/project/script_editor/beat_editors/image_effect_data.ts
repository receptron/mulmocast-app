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

const buildPanScript = (effectType: EffectType, scale: number, panDistance: number): string[] => {
  const axis = effectType === "moveToLeft" || effectType === "moveToRight" ? "x" : "y";
  // Keep legacy direction semantics to preserve existing UI behavior.
  const direction = effectType === "moveToLeft" || effectType === "moveToTop" ? 1 : -1;
  const panOptions = JSON.stringify({
    axis,
    direction,
    distance: panDistance,
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

const buildScript = (effectType: EffectType, zoom: number, panDistance: number): string[] => {
  const scale = zoom / 100;
  return isPanEffect(effectType) ? buildPanScript(effectType, scale, panDistance) : buildZoomScript(effectType, scale);
};

export const generateEffectTemplate = (
  effectType: EffectType,
  imageSrc: string,
  zoom: number,
  panDistance: number = effectDefaults.panDistance,
): { html: string[]; script: string[] } => {
  return {
    html: buildHtml(imageSrc),
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
