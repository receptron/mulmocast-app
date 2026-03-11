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
    // Move effects: script calculates cover size (object-fit:cover equivalent) with load/resize fallback.
    return [
      "<div class='h-full w-full overflow-hidden relative bg-black'>",
      "  <div id='photo_wrap' style='position:absolute;inset:0'>",
      `    <img id='photo_img' src='${imageSrc}' style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);max-width:none;max-height:none' />`,
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
    const axis = effectType === "moveToLeft" || effectType === "moveToRight" ? "x" : "y";
    const direction = effectType === "moveToLeft" || effectType === "moveToTop" ? 1 : -1;
    // Move effects are rendered with a custom render() function (without MulmoAnimation)
    // to avoid transform-side effects and to clamp pan by real overflow.
    const panScript =
      "const img=document.querySelector('#photo_img');const wrap=document.querySelector('#photo_wrap');" +
      "let __panState=window.__panState;" +
      `const axis='${axis}';const direction=${direction};const requestedDistance=${panDistance};const zoom=${scale};` +
      "function render(frame,totalFrames){if(!img||!wrap)return;" +
      "if(!__panState){if(!img.naturalWidth||!img.naturalHeight)return;" +
      "const ww=wrap.clientWidth||wrap.offsetWidth;const wh=wrap.clientHeight||wrap.offsetHeight;if(!ww||!wh)return;" +
      "const cover=Math.max(ww/img.naturalWidth,wh/img.naturalHeight);const s=cover*zoom;" +
      "const iw=img.naturalWidth*s;const ih=img.naturalHeight*s;" +
      "img.style.width=iw+'px';img.style.height=ih+'px';img.style.maxWidth='none';img.style.maxHeight='none';" +
      "const viewport=axis==='x'?ww:wh;const imageSize=axis==='x'?iw:ih;" +
      "const maxDistancePercent=Math.max(0,((imageSize-viewport)/2)/viewport*100);" +
      "const distancePercent=Math.min(requestedDistance,maxDistancePercent);" +
      "const from=50;const to=from+(direction*distancePercent);" +
      "__panState={axis,from,to};window.__panState=__panState;}" +
      "const denom=Math.max(1,totalFrames-1);const t=Math.max(0,Math.min(1,frame/denom));" +
      "const current=__panState.from+(__panState.to-__panState.from)*t;" +
      "if(__panState.axis==='x'){img.style.left=current+'%';}else{img.style.top=current+'%';}}";
    return [panScript];
  }

  const animateParams = JSON.stringify(getZoomParams(effectType, scale));
  return [
    "const animation = new MulmoAnimation();",
    `animation.animate('#photo_wrap', ${animateParams}, { start: 0, end: 'auto', easing: 'linear' });`,
  ];
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
