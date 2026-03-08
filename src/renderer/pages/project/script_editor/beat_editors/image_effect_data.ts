export type EffectType = "zoomIn" | "zoomOut" | "panLeft" | "panRight" | "panUp" | "panDown";

export const EFFECT_TYPES: EffectType[] = ["zoomIn", "zoomOut", "panLeft", "panRight", "panUp", "panDown"];

const DEFAULT_ZOOM = 120;
const DEFAULT_DURATION = 5;

export const effectDefaults = {
  zoom: DEFAULT_ZOOM,
  duration: DEFAULT_DURATION,
};

const buildHtml = (imageSrc: string): string[] => [
  "<div class='h-full w-full overflow-hidden relative bg-black'>",
  "  <div id='photo_wrap' style='position:absolute;inset:0;overflow:hidden'>",
  `    <img src='${imageSrc}' style='width:100%;height:100%;object-fit:cover' />`,
  "  </div>",
  "</div>",
];

const buildScript = (effectType: EffectType, zoom: number): string[] => {
  const scale = zoom / 100;
  const animateParams = getAnimateParams(effectType, scale);
  return [
    "const animation = new MulmoAnimation();",
    `animation.animate('#photo_wrap', ${JSON.stringify(animateParams)}, { start: 0, end: 'auto', easing: 'linear' });`,
  ];
};

const getAnimateParams = (
  effectType: EffectType,
  scale: number,
): Record<string, [number | string, number | string]> => {
  switch (effectType) {
    case "zoomIn":
      return { scale: [1.0, scale] };
    case "zoomOut":
      return { scale: [scale, 1.0] };
    case "panLeft":
      return { translateX: ["0%", "-20%"] };
    case "panRight":
      return { translateX: ["0%", "20%"] };
    case "panUp":
      return { translateY: ["0%", "-20%"] };
    case "panDown":
      return { translateY: ["0%", "20%"] };
  }
};

export const generateEffectTemplate = (
  effectType: EffectType,
  imageSrc: string,
  zoom: number,
): { html: string[]; script: string[] } => {
  return {
    html: buildHtml(imageSrc),
    script: buildScript(effectType, zoom),
  };
};

export const isTemplateMatch = (
  currentHtml: string | string[] | undefined,
  currentScript: string | string[] | undefined,
  effectType: EffectType,
  imageSrc: string,
  zoom: number,
): boolean => {
  const template = generateEffectTemplate(effectType, imageSrc, zoom);
  const htmlArr = Array.isArray(currentHtml) ? currentHtml : [currentHtml ?? ""];
  const scriptArr = Array.isArray(currentScript) ? currentScript : [currentScript ?? ""];
  return (
    JSON.stringify(htmlArr) === JSON.stringify(template.html) &&
    JSON.stringify(scriptArr) === JSON.stringify(template.script)
  );
};
