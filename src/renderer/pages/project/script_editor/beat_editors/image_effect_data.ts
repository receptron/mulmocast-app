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
  // Shared layout for zoom/move effects: full-frame clip + centered absolute image.
  return [
    "<div style='position:absolute;inset:0;overflow:hidden;background:black'>",
    "  <div id='photo_wrap' style='position:absolute;inset:0'>",
    `    <img id='photo_img' src='${imageSrc}' style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);max-width:none;max-height:none' />`,
    "  </div>",
    "</div>",
  ];
};

const SCRIPT_SETUP =
  "const img=document.querySelector('#photo_img');const wrap=document.querySelector('#photo_wrap');" +
  "function render(frame,totalFrames){if(!img||!wrap)return;" +
  "if(!img.naturalWidth||!img.naturalHeight)return;" +
  "const ww=wrap.clientWidth||wrap.offsetWidth;const wh=wrap.clientHeight||wrap.offsetHeight;if(!ww||!wh)return;" +
  "const cover=Math.max(ww/img.naturalWidth,wh/img.naturalHeight);";

const SCRIPT_FRAME_PROGRESS = "const denom=Math.max(1,totalFrames-1);const t=Math.max(0,Math.min(1,frame/denom));";

const SCRIPT_END = "}";

const buildPanScript = (effectType: EffectType, scale: number, panDistance: number): string => {
  const axis = effectType === "moveToLeft" || effectType === "moveToRight" ? "x" : "y";
  const direction = effectType === "moveToLeft" || effectType === "moveToTop" ? 1 : -1;
  return [
    SCRIPT_SETUP,
    `const axis='${axis}';const direction=${direction};const requestedDistance=${panDistance};const zoom=${scale};`,
    "const s=cover*zoom;const iw=img.naturalWidth*s;const ih=img.naturalHeight*s;",
    "img.style.width=iw+'px';img.style.height=ih+'px';img.style.maxWidth='none';img.style.maxHeight='none';",
    "const viewport=axis==='x'?ww:wh;const imageSize=axis==='x'?iw:ih;",
    "const maxDistancePercent=Math.max(0,((imageSize-viewport)/2)/viewport*100);",
    "const distancePercent=Math.min(requestedDistance,maxDistancePercent);",
    "const from=50;const to=from+(direction*distancePercent);",
    SCRIPT_FRAME_PROGRESS,
    "const current=from+(to-from)*t;",
    "if(axis==='x'){img.style.left=current+'%';}else{img.style.top=current+'%';}",
    SCRIPT_END,
  ].join("");
};

const buildZoomScript = (effectType: EffectType, scale: number): string => {
  const zoomFrom = effectType === "zoomOut" ? scale : 1.0;
  const zoomTo = effectType === "zoomOut" ? 1.0 : scale;
  return [
    SCRIPT_SETUP,
    `const zoomFrom=${zoomFrom};const zoomTo=${zoomTo};`,
    SCRIPT_FRAME_PROGRESS,
    "const z=zoomFrom+((zoomTo-zoomFrom)*t);",
    "const s=cover*z;",
    "img.style.width=(img.naturalWidth*s)+'px';img.style.height=(img.naturalHeight*s)+'px';",
    SCRIPT_END,
  ].join("");
};

const buildScript = (effectType: EffectType, zoom: number, panDistance: number): string[] => {
  const scale = zoom / 100;
  return isPanEffect(effectType) ? [buildPanScript(effectType, scale, panDistance)] : [buildZoomScript(effectType, scale)];
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
