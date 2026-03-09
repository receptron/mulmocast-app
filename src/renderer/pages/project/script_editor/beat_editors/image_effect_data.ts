export type EffectType = "zoomIn" | "zoomOut" | "leftToRight" | "rightToLeft" | "topToBottom" | "bottomToTop";

export const EFFECT_TYPES: EffectType[] = ["zoomIn", "zoomOut", "leftToRight", "rightToLeft", "topToBottom", "bottomToTop"];

const DEFAULT_ZOOM = 120;
const DEFAULT_DURATION = 5;
const DEFAULT_PAN_DISTANCE = 10;

export const effectDefaults = {
  zoom: DEFAULT_ZOOM,
  duration: DEFAULT_DURATION,
  panDistance: DEFAULT_PAN_DISTANCE,
};

export const isPanEffect = (effect: EffectType | null): boolean => {
  return effect === "leftToRight" || effect === "rightToLeft" || effect === "topToBottom" || effect === "bottomToTop";
};

const buildHtml = (imageSrc: string): string[] => [
  "<div class='h-full w-full overflow-hidden relative bg-black'>",
  "  <div id='photo_wrap' style='position:absolute;inset:0;overflow:hidden'>",
  `    <img src='${imageSrc}' style='width:100%;height:100%;object-fit:cover' />`,
  "  </div>",
  "</div>",
];

const buildScript = (effectType: EffectType, zoom: number, panDistance: number): string[] => {
  const scale = zoom / 100;
  const animateParams = getAnimateParams(effectType, scale, panDistance);
  return [
    "const animation = new MulmoAnimation();",
    `animation.animate('#photo_wrap', ${JSON.stringify(animateParams)}, { start: 0, end: 'auto', easing: 'linear' });`,
  ];
};

const getAnimateParams = (
  effectType: EffectType,
  scale: number,
  panDistance: number,
): Record<string, (number | string)[]> => {
  switch (effectType) {
    case "zoomIn":
      return { scale: [1.0, scale] };
    case "zoomOut":
      return { scale: [scale, 1.0] };
    case "leftToRight":
      return { scale: [scale, scale], translateX: [0, panDistance, "%"] };
    case "rightToLeft":
      return { scale: [scale, scale], translateX: [0, -panDistance, "%"] };
    case "topToBottom":
      return { scale: [scale, scale], translateY: [0, panDistance, "%"] };
    case "bottomToTop":
      return { scale: [scale, scale], translateY: [0, -panDistance, "%"] };
  }
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
