import { c as createLucideIcon, ao as Title, ab as React__default, ap as Root$1, aq as Content$1, ar as Portal$1, as as Overlay$1, r as reactExports, j as jsxRuntimeExports, k as cn, u as useActor, n as useQueryClient, m as useQuery, o as useMutation, p as ue, at as DocumentType, au as Dialog, av as DialogContent, aw as DialogHeader, ax as DialogTitle, ay as DialogFooter, az as BookOpen, q as Skeleton, aA as CircleAlert, B as Button, X, V as MessageSquare, aB as FileText, aC as DialogDescription, L as LoaderCircle, T as Trash2, aD as Calendar, i as Badge, ag as Download, aE as MarkdownStatus, R as RefreshCw, C as CircleCheckBig, F as Label, ah as Select, ai as SelectTrigger, aj as SelectValue, ak as SelectContent, al as SelectItem, f as Textarea, z as Shield, v as Card, a1 as Sparkles, E as CardContent, af as TriangleAlert, a3 as Lock, aF as ShieldCheck } from "./index-C-RLbQrs.js";
import { U as Upload } from "./upload-z_EyXbuv.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  [
    "path",
    { d: "M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3", key: "ms7g94" }
  ],
  ["path", { d: "m9 18-1.5-1.5", key: "1j6qii" }],
  ["circle", { cx: "5", cy: "14", r: "3", key: "ufru5t" }]
];
const FileSearch = createLucideIcon("file-search", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z", key: "qazsjp" }],
  ["path", { d: "M15 3v4a2 2 0 0 0 2 2h4", key: "40519r" }]
];
const StickyNote = createLucideIcon("sticky-note", __iconNode);
function toDocumentType(raw) {
  const map = {
    registration: "registration",
    licence: "licence",
    invoice: "invoice",
    other: "other"
  };
  return map[raw] ?? "other";
}
const DOCUMENT_TYPE_LABELS = {
  registration: "Vehicle Registration",
  licence: "Driver's Licence",
  invoice: "Invoice / Receipt",
  other: "Other"
};
function __insertCSS(code) {
  if (typeof document == "undefined") return;
  let head = document.head || document.getElementsByTagName("head")[0];
  let style = document.createElement("style");
  style.type = "text/css";
  head.appendChild(style);
  style.styleSheet ? style.styleSheet.cssText = code : style.appendChild(document.createTextNode(code));
}
const DrawerContext = React__default.createContext({
  drawerRef: {
    current: null
  },
  overlayRef: {
    current: null
  },
  onPress: () => {
  },
  onRelease: () => {
  },
  onDrag: () => {
  },
  onNestedDrag: () => {
  },
  onNestedOpenChange: () => {
  },
  onNestedRelease: () => {
  },
  openProp: void 0,
  dismissible: false,
  isOpen: false,
  isDragging: false,
  keyboardIsOpen: {
    current: false
  },
  snapPointsOffset: null,
  snapPoints: null,
  handleOnly: false,
  modal: false,
  shouldFade: false,
  activeSnapPoint: null,
  onOpenChange: () => {
  },
  setActiveSnapPoint: () => {
  },
  closeDrawer: () => {
  },
  direction: "bottom",
  shouldAnimate: {
    current: true
  },
  shouldScaleBackground: false,
  setBackgroundColorOnScale: true,
  noBodyStyles: false,
  container: null,
  autoFocus: false
});
const useDrawerContext = () => {
  const context = React__default.useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawerContext must be used within a Drawer.Root");
  }
  return context;
};
__insertCSS("[data-vaul-drawer]{touch-action:none;will-change:transform;transition:transform .5s cubic-bezier(.32, .72, 0, 1);animation-duration:.5s;animation-timing-function:cubic-bezier(0.32,0.72,0,1)}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=bottom][data-state=open]{animation-name:slideFromBottom}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=bottom][data-state=closed]{animation-name:slideToBottom}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=top][data-state=open]{animation-name:slideFromTop}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=top][data-state=closed]{animation-name:slideToTop}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=left][data-state=open]{animation-name:slideFromLeft}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=left][data-state=closed]{animation-name:slideToLeft}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=right][data-state=open]{animation-name:slideFromRight}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=right][data-state=closed]{animation-name:slideToRight}[data-vaul-drawer][data-vaul-snap-points=true][data-vaul-drawer-direction=bottom]{transform:translate3d(0,var(--initial-transform,100%),0)}[data-vaul-drawer][data-vaul-snap-points=true][data-vaul-drawer-direction=top]{transform:translate3d(0,calc(var(--initial-transform,100%) * -1),0)}[data-vaul-drawer][data-vaul-snap-points=true][data-vaul-drawer-direction=left]{transform:translate3d(calc(var(--initial-transform,100%) * -1),0,0)}[data-vaul-drawer][data-vaul-snap-points=true][data-vaul-drawer-direction=right]{transform:translate3d(var(--initial-transform,100%),0,0)}[data-vaul-drawer][data-vaul-delayed-snap-points=true][data-vaul-drawer-direction=top]{transform:translate3d(0,var(--snap-point-height,0),0)}[data-vaul-drawer][data-vaul-delayed-snap-points=true][data-vaul-drawer-direction=bottom]{transform:translate3d(0,var(--snap-point-height,0),0)}[data-vaul-drawer][data-vaul-delayed-snap-points=true][data-vaul-drawer-direction=left]{transform:translate3d(var(--snap-point-height,0),0,0)}[data-vaul-drawer][data-vaul-delayed-snap-points=true][data-vaul-drawer-direction=right]{transform:translate3d(var(--snap-point-height,0),0,0)}[data-vaul-overlay][data-vaul-snap-points=false]{animation-duration:.5s;animation-timing-function:cubic-bezier(0.32,0.72,0,1)}[data-vaul-overlay][data-vaul-snap-points=false][data-state=open]{animation-name:fadeIn}[data-vaul-overlay][data-state=closed]{animation-name:fadeOut}[data-vaul-animate=false]{animation:none!important}[data-vaul-overlay][data-vaul-snap-points=true]{opacity:0;transition:opacity .5s cubic-bezier(.32, .72, 0, 1)}[data-vaul-overlay][data-vaul-snap-points=true]{opacity:1}[data-vaul-drawer]:not([data-vaul-custom-container=true])::after{content:'';position:absolute;background:inherit;background-color:inherit}[data-vaul-drawer][data-vaul-drawer-direction=top]::after{top:initial;bottom:100%;left:0;right:0;height:200%}[data-vaul-drawer][data-vaul-drawer-direction=bottom]::after{top:100%;bottom:initial;left:0;right:0;height:200%}[data-vaul-drawer][data-vaul-drawer-direction=left]::after{left:initial;right:100%;top:0;bottom:0;width:200%}[data-vaul-drawer][data-vaul-drawer-direction=right]::after{left:100%;right:initial;top:0;bottom:0;width:200%}[data-vaul-overlay][data-vaul-snap-points=true]:not([data-vaul-snap-points-overlay=true]):not(\n[data-state=closed]\n){opacity:0}[data-vaul-overlay][data-vaul-snap-points-overlay=true]{opacity:1}[data-vaul-handle]{display:block;position:relative;opacity:.7;background:#e2e2e4;margin-left:auto;margin-right:auto;height:5px;width:32px;border-radius:1rem;touch-action:pan-y}[data-vaul-handle]:active,[data-vaul-handle]:hover{opacity:1}[data-vaul-handle-hitarea]{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:max(100%,2.75rem);height:max(100%,2.75rem);touch-action:inherit}@media (hover:hover) and (pointer:fine){[data-vaul-drawer]{user-select:none}}@media (pointer:fine){[data-vaul-handle-hitarea]:{width:100%;height:100%}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeOut{to{opacity:0}}@keyframes slideFromBottom{from{transform:translate3d(0,var(--initial-transform,100%),0)}to{transform:translate3d(0,0,0)}}@keyframes slideToBottom{to{transform:translate3d(0,var(--initial-transform,100%),0)}}@keyframes slideFromTop{from{transform:translate3d(0,calc(var(--initial-transform,100%) * -1),0)}to{transform:translate3d(0,0,0)}}@keyframes slideToTop{to{transform:translate3d(0,calc(var(--initial-transform,100%) * -1),0)}}@keyframes slideFromLeft{from{transform:translate3d(calc(var(--initial-transform,100%) * -1),0,0)}to{transform:translate3d(0,0,0)}}@keyframes slideToLeft{to{transform:translate3d(calc(var(--initial-transform,100%) * -1),0,0)}}@keyframes slideFromRight{from{transform:translate3d(var(--initial-transform,100%),0,0)}to{transform:translate3d(0,0,0)}}@keyframes slideToRight{to{transform:translate3d(var(--initial-transform,100%),0,0)}}");
function isMobileFirefox() {
  const userAgent = navigator.userAgent;
  return typeof window !== "undefined" && (/Firefox/.test(userAgent) && /Mobile/.test(userAgent) || // Android Firefox
  /FxiOS/.test(userAgent));
}
function isMac() {
  return testPlatform(/^Mac/);
}
function isIPhone() {
  return testPlatform(/^iPhone/);
}
function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}
function isIPad() {
  return testPlatform(/^iPad/) || // iPadOS 13 lies and says it's a Mac, but we can distinguish by detecting touch support.
  isMac() && navigator.maxTouchPoints > 1;
}
function isIOS() {
  return isIPhone() || isIPad();
}
function testPlatform(re) {
  return typeof window !== "undefined" && window.navigator != null ? re.test(window.navigator.platform) : void 0;
}
const KEYBOARD_BUFFER = 24;
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? reactExports.useLayoutEffect : reactExports.useEffect;
function chain$1(...callbacks) {
  return (...args) => {
    for (let callback of callbacks) {
      if (typeof callback === "function") {
        callback(...args);
      }
    }
  };
}
const visualViewport = typeof document !== "undefined" && window.visualViewport;
function isScrollable(node) {
  let style = window.getComputedStyle(node);
  return /(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY);
}
function getScrollParent(node) {
  if (isScrollable(node)) {
    node = node.parentElement;
  }
  while (node && !isScrollable(node)) {
    node = node.parentElement;
  }
  return node || document.scrollingElement || document.documentElement;
}
const nonTextInputTypes = /* @__PURE__ */ new Set([
  "checkbox",
  "radio",
  "range",
  "color",
  "file",
  "image",
  "button",
  "submit",
  "reset"
]);
let preventScrollCount = 0;
let restore;
function usePreventScroll(options = {}) {
  let { isDisabled } = options;
  useIsomorphicLayoutEffect(() => {
    if (isDisabled) {
      return;
    }
    preventScrollCount++;
    if (preventScrollCount === 1) {
      if (isIOS()) {
        restore = preventScrollMobileSafari();
      }
    }
    return () => {
      preventScrollCount--;
      if (preventScrollCount === 0) {
        restore == null ? void 0 : restore();
      }
    };
  }, [
    isDisabled
  ]);
}
function preventScrollMobileSafari() {
  let scrollable;
  let lastY = 0;
  let onTouchStart = (e) => {
    scrollable = getScrollParent(e.target);
    if (scrollable === document.documentElement && scrollable === document.body) {
      return;
    }
    lastY = e.changedTouches[0].pageY;
  };
  let onTouchMove = (e) => {
    if (!scrollable || scrollable === document.documentElement || scrollable === document.body) {
      e.preventDefault();
      return;
    }
    let y = e.changedTouches[0].pageY;
    let scrollTop = scrollable.scrollTop;
    let bottom = scrollable.scrollHeight - scrollable.clientHeight;
    if (bottom === 0) {
      return;
    }
    if (scrollTop <= 0 && y > lastY || scrollTop >= bottom && y < lastY) {
      e.preventDefault();
    }
    lastY = y;
  };
  let onTouchEnd = (e) => {
    let target = e.target;
    if (isInput(target) && target !== document.activeElement) {
      e.preventDefault();
      target.style.transform = "translateY(-2000px)";
      target.focus();
      requestAnimationFrame(() => {
        target.style.transform = "";
      });
    }
  };
  let onFocus = (e) => {
    let target = e.target;
    if (isInput(target)) {
      target.style.transform = "translateY(-2000px)";
      requestAnimationFrame(() => {
        target.style.transform = "";
        if (visualViewport) {
          if (visualViewport.height < window.innerHeight) {
            requestAnimationFrame(() => {
              scrollIntoView(target);
            });
          } else {
            visualViewport.addEventListener("resize", () => scrollIntoView(target), {
              once: true
            });
          }
        }
      });
    }
  };
  let onWindowScroll = () => {
    window.scrollTo(0, 0);
  };
  let scrollX = window.pageXOffset;
  let scrollY = window.pageYOffset;
  let restoreStyles = chain$1(setStyle(document.documentElement, "paddingRight", `${window.innerWidth - document.documentElement.clientWidth}px`));
  window.scrollTo(0, 0);
  let removeEvents = chain$1(addEvent(document, "touchstart", onTouchStart, {
    passive: false,
    capture: true
  }), addEvent(document, "touchmove", onTouchMove, {
    passive: false,
    capture: true
  }), addEvent(document, "touchend", onTouchEnd, {
    passive: false,
    capture: true
  }), addEvent(document, "focus", onFocus, true), addEvent(window, "scroll", onWindowScroll));
  return () => {
    restoreStyles();
    removeEvents();
    window.scrollTo(scrollX, scrollY);
  };
}
function setStyle(element, style, value) {
  let cur = element.style[style];
  element.style[style] = value;
  return () => {
    element.style[style] = cur;
  };
}
function addEvent(target, event, handler, options) {
  target.addEventListener(event, handler, options);
  return () => {
    target.removeEventListener(event, handler, options);
  };
}
function scrollIntoView(target) {
  let root = document.scrollingElement || document.documentElement;
  while (target && target !== root) {
    let scrollable = getScrollParent(target);
    if (scrollable !== document.documentElement && scrollable !== document.body && scrollable !== target) {
      let scrollableTop = scrollable.getBoundingClientRect().top;
      let targetTop = target.getBoundingClientRect().top;
      let targetBottom = target.getBoundingClientRect().bottom;
      const keyboardHeight = scrollable.getBoundingClientRect().bottom + KEYBOARD_BUFFER;
      if (targetBottom > keyboardHeight) {
        scrollable.scrollTop += targetTop - scrollableTop;
      }
    }
    target = scrollable.parentElement;
  }
}
function isInput(target) {
  return target instanceof HTMLInputElement && !nonTextInputTypes.has(target.type) || target instanceof HTMLTextAreaElement || target instanceof HTMLElement && target.isContentEditable;
}
function setRef(ref, value) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref !== null && ref !== void 0) {
    ref.current = value;
  }
}
function composeRefs(...refs) {
  return (node) => refs.forEach((ref) => setRef(ref, node));
}
function useComposedRefs(...refs) {
  return reactExports.useCallback(composeRefs(...refs), refs);
}
const cache = /* @__PURE__ */ new WeakMap();
function set(el, styles, ignoreCache = false) {
  if (!el || !(el instanceof HTMLElement)) return;
  let originalStyles = {};
  Object.entries(styles).forEach(([key, value]) => {
    if (key.startsWith("--")) {
      el.style.setProperty(key, value);
      return;
    }
    originalStyles[key] = el.style[key];
    el.style[key] = value;
  });
  if (ignoreCache) return;
  cache.set(el, originalStyles);
}
function reset(el, prop) {
  if (!el || !(el instanceof HTMLElement)) return;
  let originalStyles = cache.get(el);
  if (!originalStyles) {
    return;
  }
  {
    el.style[prop] = originalStyles[prop];
  }
}
const isVertical = (direction) => {
  switch (direction) {
    case "top":
    case "bottom":
      return true;
    case "left":
    case "right":
      return false;
    default:
      return direction;
  }
};
function getTranslate(element, direction) {
  if (!element) {
    return null;
  }
  const style = window.getComputedStyle(element);
  const transform = (
    // @ts-ignore
    style.transform || style.webkitTransform || style.mozTransform
  );
  let mat = transform.match(/^matrix3d\((.+)\)$/);
  if (mat) {
    return parseFloat(mat[1].split(", ")[isVertical(direction) ? 13 : 12]);
  }
  mat = transform.match(/^matrix\((.+)\)$/);
  return mat ? parseFloat(mat[1].split(", ")[isVertical(direction) ? 5 : 4]) : null;
}
function dampenValue(v) {
  return 8 * (Math.log(v + 1) - 2);
}
function assignStyle(element, style) {
  if (!element) return () => {
  };
  const prevStyle = element.style.cssText;
  Object.assign(element.style, style);
  return () => {
    element.style.cssText = prevStyle;
  };
}
function chain(...fns) {
  return (...args) => {
    for (const fn of fns) {
      if (typeof fn === "function") {
        fn(...args);
      }
    }
  };
}
const TRANSITIONS = {
  DURATION: 0.5,
  EASE: [
    0.32,
    0.72,
    0,
    1
  ]
};
const VELOCITY_THRESHOLD = 0.4;
const CLOSE_THRESHOLD = 0.25;
const SCROLL_LOCK_TIMEOUT = 100;
const BORDER_RADIUS = 8;
const NESTED_DISPLACEMENT = 16;
const WINDOW_TOP_OFFSET = 26;
const DRAG_CLASS = "vaul-dragging";
function useCallbackRef(callback) {
  const callbackRef = React__default.useRef(callback);
  React__default.useEffect(() => {
    callbackRef.current = callback;
  });
  return React__default.useMemo(() => (...args) => callbackRef.current == null ? void 0 : callbackRef.current.call(callbackRef, ...args), []);
}
function useUncontrolledState({ defaultProp, onChange }) {
  const uncontrolledState = React__default.useState(defaultProp);
  const [value] = uncontrolledState;
  const prevValueRef = React__default.useRef(value);
  const handleChange = useCallbackRef(onChange);
  React__default.useEffect(() => {
    if (prevValueRef.current !== value) {
      handleChange(value);
      prevValueRef.current = value;
    }
  }, [
    value,
    prevValueRef,
    handleChange
  ]);
  return uncontrolledState;
}
function useControllableState({ prop, defaultProp, onChange = () => {
} }) {
  const [uncontrolledProp, setUncontrolledProp] = useUncontrolledState({
    defaultProp,
    onChange
  });
  const isControlled = prop !== void 0;
  const value = isControlled ? prop : uncontrolledProp;
  const handleChange = useCallbackRef(onChange);
  const setValue = React__default.useCallback((nextValue) => {
    if (isControlled) {
      const setter = nextValue;
      const value2 = typeof nextValue === "function" ? setter(prop) : nextValue;
      if (value2 !== prop) handleChange(value2);
    } else {
      setUncontrolledProp(nextValue);
    }
  }, [
    isControlled,
    prop,
    setUncontrolledProp,
    handleChange
  ]);
  return [
    value,
    setValue
  ];
}
function useSnapPoints({ activeSnapPointProp, setActiveSnapPointProp, snapPoints, drawerRef, overlayRef, fadeFromIndex, onSnapPointChange, direction = "bottom", container, snapToSequentialPoint }) {
  const [activeSnapPoint, setActiveSnapPoint] = useControllableState({
    prop: activeSnapPointProp,
    defaultProp: snapPoints == null ? void 0 : snapPoints[0],
    onChange: setActiveSnapPointProp
  });
  const [windowDimensions, setWindowDimensions] = React__default.useState(typeof window !== "undefined" ? {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight
  } : void 0);
  React__default.useEffect(() => {
    function onResize() {
      setWindowDimensions({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
      });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isLastSnapPoint = React__default.useMemo(() => activeSnapPoint === (snapPoints == null ? void 0 : snapPoints[snapPoints.length - 1]) || null, [
    snapPoints,
    activeSnapPoint
  ]);
  const activeSnapPointIndex = React__default.useMemo(() => {
    var _snapPoints_findIndex;
    return (_snapPoints_findIndex = snapPoints == null ? void 0 : snapPoints.findIndex((snapPoint) => snapPoint === activeSnapPoint)) != null ? _snapPoints_findIndex : null;
  }, [
    snapPoints,
    activeSnapPoint
  ]);
  const shouldFade = snapPoints && snapPoints.length > 0 && (fadeFromIndex || fadeFromIndex === 0) && !Number.isNaN(fadeFromIndex) && snapPoints[fadeFromIndex] === activeSnapPoint || !snapPoints;
  const snapPointsOffset = React__default.useMemo(() => {
    const containerSize = container ? {
      width: container.getBoundingClientRect().width,
      height: container.getBoundingClientRect().height
    } : typeof window !== "undefined" ? {
      width: window.innerWidth,
      height: window.innerHeight
    } : {
      width: 0,
      height: 0
    };
    var _snapPoints_map;
    return (_snapPoints_map = snapPoints == null ? void 0 : snapPoints.map((snapPoint) => {
      const isPx = typeof snapPoint === "string";
      let snapPointAsNumber = 0;
      if (isPx) {
        snapPointAsNumber = parseInt(snapPoint, 10);
      }
      if (isVertical(direction)) {
        const height = isPx ? snapPointAsNumber : windowDimensions ? snapPoint * containerSize.height : 0;
        if (windowDimensions) {
          return direction === "bottom" ? containerSize.height - height : -containerSize.height + height;
        }
        return height;
      }
      const width = isPx ? snapPointAsNumber : windowDimensions ? snapPoint * containerSize.width : 0;
      if (windowDimensions) {
        return direction === "right" ? containerSize.width - width : -containerSize.width + width;
      }
      return width;
    })) != null ? _snapPoints_map : [];
  }, [
    snapPoints,
    windowDimensions,
    container
  ]);
  const activeSnapPointOffset = React__default.useMemo(() => activeSnapPointIndex !== null ? snapPointsOffset == null ? void 0 : snapPointsOffset[activeSnapPointIndex] : null, [
    snapPointsOffset,
    activeSnapPointIndex
  ]);
  const snapToPoint = React__default.useCallback((dimension) => {
    var _snapPointsOffset_findIndex;
    const newSnapPointIndex = (_snapPointsOffset_findIndex = snapPointsOffset == null ? void 0 : snapPointsOffset.findIndex((snapPointDim) => snapPointDim === dimension)) != null ? _snapPointsOffset_findIndex : null;
    onSnapPointChange(newSnapPointIndex);
    set(drawerRef.current, {
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(",")})`,
      transform: isVertical(direction) ? `translate3d(0, ${dimension}px, 0)` : `translate3d(${dimension}px, 0, 0)`
    });
    if (snapPointsOffset && newSnapPointIndex !== snapPointsOffset.length - 1 && fadeFromIndex !== void 0 && newSnapPointIndex !== fadeFromIndex && newSnapPointIndex < fadeFromIndex) {
      set(overlayRef.current, {
        transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(",")})`,
        opacity: "0"
      });
    } else {
      set(overlayRef.current, {
        transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(",")})`,
        opacity: "1"
      });
    }
    setActiveSnapPoint(snapPoints == null ? void 0 : snapPoints[Math.max(newSnapPointIndex, 0)]);
  }, [
    drawerRef.current,
    snapPoints,
    snapPointsOffset,
    fadeFromIndex,
    overlayRef,
    setActiveSnapPoint
  ]);
  React__default.useEffect(() => {
    if (activeSnapPoint || activeSnapPointProp) {
      var _snapPoints_findIndex;
      const newIndex = (_snapPoints_findIndex = snapPoints == null ? void 0 : snapPoints.findIndex((snapPoint) => snapPoint === activeSnapPointProp || snapPoint === activeSnapPoint)) != null ? _snapPoints_findIndex : -1;
      if (snapPointsOffset && newIndex !== -1 && typeof snapPointsOffset[newIndex] === "number") {
        snapToPoint(snapPointsOffset[newIndex]);
      }
    }
  }, [
    activeSnapPoint,
    activeSnapPointProp,
    snapPoints,
    snapPointsOffset,
    snapToPoint
  ]);
  function onRelease({ draggedDistance, closeDrawer, velocity, dismissible }) {
    if (fadeFromIndex === void 0) return;
    const currentPosition = direction === "bottom" || direction === "right" ? (activeSnapPointOffset != null ? activeSnapPointOffset : 0) - draggedDistance : (activeSnapPointOffset != null ? activeSnapPointOffset : 0) + draggedDistance;
    const isOverlaySnapPoint = activeSnapPointIndex === fadeFromIndex - 1;
    const isFirst = activeSnapPointIndex === 0;
    const hasDraggedUp = draggedDistance > 0;
    if (isOverlaySnapPoint) {
      set(overlayRef.current, {
        transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(",")})`
      });
    }
    if (!snapToSequentialPoint && velocity > 2 && !hasDraggedUp) {
      if (dismissible) closeDrawer();
      else snapToPoint(snapPointsOffset[0]);
      return;
    }
    if (!snapToSequentialPoint && velocity > 2 && hasDraggedUp && snapPointsOffset && snapPoints) {
      snapToPoint(snapPointsOffset[snapPoints.length - 1]);
      return;
    }
    const closestSnapPoint = snapPointsOffset == null ? void 0 : snapPointsOffset.reduce((prev, curr) => {
      if (typeof prev !== "number" || typeof curr !== "number") return prev;
      return Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev;
    });
    const dim = isVertical(direction) ? window.innerHeight : window.innerWidth;
    if (velocity > VELOCITY_THRESHOLD && Math.abs(draggedDistance) < dim * 0.4) {
      const dragDirection = hasDraggedUp ? 1 : -1;
      if (dragDirection > 0 && isLastSnapPoint && snapPoints) {
        snapToPoint(snapPointsOffset[snapPoints.length - 1]);
        return;
      }
      if (isFirst && dragDirection < 0 && dismissible) {
        closeDrawer();
      }
      if (activeSnapPointIndex === null) return;
      snapToPoint(snapPointsOffset[activeSnapPointIndex + dragDirection]);
      return;
    }
    snapToPoint(closestSnapPoint);
  }
  function onDrag({ draggedDistance }) {
    if (activeSnapPointOffset === null) return;
    const newValue = direction === "bottom" || direction === "right" ? activeSnapPointOffset - draggedDistance : activeSnapPointOffset + draggedDistance;
    if ((direction === "bottom" || direction === "right") && newValue < snapPointsOffset[snapPointsOffset.length - 1]) {
      return;
    }
    if ((direction === "top" || direction === "left") && newValue > snapPointsOffset[snapPointsOffset.length - 1]) {
      return;
    }
    set(drawerRef.current, {
      transform: isVertical(direction) ? `translate3d(0, ${newValue}px, 0)` : `translate3d(${newValue}px, 0, 0)`
    });
  }
  function getPercentageDragged(absDraggedDistance, isDraggingDown) {
    if (!snapPoints || typeof activeSnapPointIndex !== "number" || !snapPointsOffset || fadeFromIndex === void 0) return null;
    const isOverlaySnapPoint = activeSnapPointIndex === fadeFromIndex - 1;
    const isOverlaySnapPointOrHigher = activeSnapPointIndex >= fadeFromIndex;
    if (isOverlaySnapPointOrHigher && isDraggingDown) {
      return 0;
    }
    if (isOverlaySnapPoint && !isDraggingDown) return 1;
    if (!shouldFade && !isOverlaySnapPoint) return null;
    const targetSnapPointIndex = isOverlaySnapPoint ? activeSnapPointIndex + 1 : activeSnapPointIndex - 1;
    const snapPointDistance = isOverlaySnapPoint ? snapPointsOffset[targetSnapPointIndex] - snapPointsOffset[targetSnapPointIndex - 1] : snapPointsOffset[targetSnapPointIndex + 1] - snapPointsOffset[targetSnapPointIndex];
    const percentageDragged = absDraggedDistance / Math.abs(snapPointDistance);
    if (isOverlaySnapPoint) {
      return 1 - percentageDragged;
    } else {
      return percentageDragged;
    }
  }
  return {
    isLastSnapPoint,
    activeSnapPoint,
    shouldFade,
    getPercentageDragged,
    setActiveSnapPoint,
    activeSnapPointIndex,
    onRelease,
    onDrag,
    snapPointsOffset
  };
}
const noop = () => () => {
};
function useScaleBackground() {
  const { direction, isOpen, shouldScaleBackground, setBackgroundColorOnScale, noBodyStyles } = useDrawerContext();
  const timeoutIdRef = React__default.useRef(null);
  const initialBackgroundColor = reactExports.useMemo(() => document.body.style.backgroundColor, []);
  function getScale() {
    return (window.innerWidth - WINDOW_TOP_OFFSET) / window.innerWidth;
  }
  React__default.useEffect(() => {
    if (isOpen && shouldScaleBackground) {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      const wrapper = document.querySelector("[data-vaul-drawer-wrapper]") || document.querySelector("[vaul-drawer-wrapper]");
      if (!wrapper) return;
      chain(setBackgroundColorOnScale && !noBodyStyles ? assignStyle(document.body, {
        background: "black"
      }) : noop, assignStyle(wrapper, {
        transformOrigin: isVertical(direction) ? "top" : "left",
        transitionProperty: "transform, border-radius",
        transitionDuration: `${TRANSITIONS.DURATION}s`,
        transitionTimingFunction: `cubic-bezier(${TRANSITIONS.EASE.join(",")})`
      }));
      const wrapperStylesCleanup = assignStyle(wrapper, {
        borderRadius: `${BORDER_RADIUS}px`,
        overflow: "hidden",
        ...isVertical(direction) ? {
          transform: `scale(${getScale()}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0)`
        } : {
          transform: `scale(${getScale()}) translate3d(calc(env(safe-area-inset-top) + 14px), 0, 0)`
        }
      });
      return () => {
        wrapperStylesCleanup();
        timeoutIdRef.current = window.setTimeout(() => {
          if (initialBackgroundColor) {
            document.body.style.background = initialBackgroundColor;
          } else {
            document.body.style.removeProperty("background");
          }
        }, TRANSITIONS.DURATION * 1e3);
      };
    }
  }, [
    isOpen,
    shouldScaleBackground,
    initialBackgroundColor
  ]);
}
let previousBodyPosition = null;
function usePositionFixed({ isOpen, modal, nested, hasBeenOpened, preventScrollRestoration, noBodyStyles }) {
  const [activeUrl, setActiveUrl] = React__default.useState(() => typeof window !== "undefined" ? window.location.href : "");
  const scrollPos = React__default.useRef(0);
  const setPositionFixed = React__default.useCallback(() => {
    if (!isSafari()) return;
    if (previousBodyPosition === null && isOpen && !noBodyStyles) {
      previousBodyPosition = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        height: document.body.style.height,
        right: "unset"
      };
      const { scrollX, innerHeight } = window;
      document.body.style.setProperty("position", "fixed", "important");
      Object.assign(document.body.style, {
        top: `${-scrollPos.current}px`,
        left: `${-scrollX}px`,
        right: "0px",
        height: "auto"
      });
      window.setTimeout(() => window.requestAnimationFrame(() => {
        const bottomBarHeight = innerHeight - window.innerHeight;
        if (bottomBarHeight && scrollPos.current >= innerHeight) {
          document.body.style.top = `${-(scrollPos.current + bottomBarHeight)}px`;
        }
      }), 300);
    }
  }, [
    isOpen
  ]);
  const restorePositionSetting = React__default.useCallback(() => {
    if (!isSafari()) return;
    if (previousBodyPosition !== null && !noBodyStyles) {
      const y = -parseInt(document.body.style.top, 10);
      const x = -parseInt(document.body.style.left, 10);
      Object.assign(document.body.style, previousBodyPosition);
      window.requestAnimationFrame(() => {
        if (preventScrollRestoration && activeUrl !== window.location.href) {
          setActiveUrl(window.location.href);
          return;
        }
        window.scrollTo(x, y);
      });
      previousBodyPosition = null;
    }
  }, [
    activeUrl
  ]);
  React__default.useEffect(() => {
    function onScroll() {
      scrollPos.current = window.scrollY;
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  React__default.useEffect(() => {
    if (!modal) return;
    return () => {
      if (typeof document === "undefined") return;
      const hasDrawerOpened = !!document.querySelector("[data-vaul-drawer]");
      if (hasDrawerOpened) return;
      restorePositionSetting();
    };
  }, [
    modal,
    restorePositionSetting
  ]);
  React__default.useEffect(() => {
    if (nested || !hasBeenOpened) return;
    if (isOpen) {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      !isStandalone && setPositionFixed();
      if (!modal) {
        window.setTimeout(() => {
          restorePositionSetting();
        }, 500);
      }
    } else {
      restorePositionSetting();
    }
  }, [
    isOpen,
    hasBeenOpened,
    activeUrl,
    modal,
    nested,
    setPositionFixed,
    restorePositionSetting
  ]);
  return {
    restorePositionSetting
  };
}
function Root({ open: openProp, onOpenChange, children, onDrag: onDragProp, onRelease: onReleaseProp, snapPoints, shouldScaleBackground = false, setBackgroundColorOnScale = true, closeThreshold = CLOSE_THRESHOLD, scrollLockTimeout = SCROLL_LOCK_TIMEOUT, dismissible = true, handleOnly = false, fadeFromIndex = snapPoints && snapPoints.length - 1, activeSnapPoint: activeSnapPointProp, setActiveSnapPoint: setActiveSnapPointProp, fixed, modal = true, onClose, nested, noBodyStyles = false, direction = "bottom", defaultOpen = false, disablePreventScroll = true, snapToSequentialPoint = false, preventScrollRestoration = false, repositionInputs = true, onAnimationEnd, container, autoFocus = false }) {
  var _drawerRef_current, _drawerRef_current1;
  const [isOpen = false, setIsOpen] = useControllableState({
    defaultProp: defaultOpen,
    prop: openProp,
    onChange: (o) => {
      onOpenChange == null ? void 0 : onOpenChange(o);
      if (!o && !nested) {
        restorePositionSetting();
      }
      setTimeout(() => {
        onAnimationEnd == null ? void 0 : onAnimationEnd(o);
      }, TRANSITIONS.DURATION * 1e3);
      if (o && !modal) {
        if (typeof window !== "undefined") {
          window.requestAnimationFrame(() => {
            document.body.style.pointerEvents = "auto";
          });
        }
      }
      if (!o) {
        document.body.style.pointerEvents = "auto";
      }
    }
  });
  const [hasBeenOpened, setHasBeenOpened] = React__default.useState(false);
  const [isDragging, setIsDragging] = React__default.useState(false);
  const [justReleased, setJustReleased] = React__default.useState(false);
  const overlayRef = React__default.useRef(null);
  const openTime = React__default.useRef(null);
  const dragStartTime = React__default.useRef(null);
  const dragEndTime = React__default.useRef(null);
  const lastTimeDragPrevented = React__default.useRef(null);
  const isAllowedToDrag = React__default.useRef(false);
  const nestedOpenChangeTimer = React__default.useRef(null);
  const pointerStart = React__default.useRef(0);
  const keyboardIsOpen = React__default.useRef(false);
  const shouldAnimate = React__default.useRef(!defaultOpen);
  const previousDiffFromInitial = React__default.useRef(0);
  const drawerRef = React__default.useRef(null);
  const drawerHeightRef = React__default.useRef(((_drawerRef_current = drawerRef.current) == null ? void 0 : _drawerRef_current.getBoundingClientRect().height) || 0);
  const drawerWidthRef = React__default.useRef(((_drawerRef_current1 = drawerRef.current) == null ? void 0 : _drawerRef_current1.getBoundingClientRect().width) || 0);
  const initialDrawerHeight = React__default.useRef(0);
  const onSnapPointChange = React__default.useCallback((activeSnapPointIndex2) => {
    if (snapPoints && activeSnapPointIndex2 === snapPointsOffset.length - 1) openTime.current = /* @__PURE__ */ new Date();
  }, []);
  const { activeSnapPoint, activeSnapPointIndex, setActiveSnapPoint, onRelease: onReleaseSnapPoints, snapPointsOffset, onDrag: onDragSnapPoints, shouldFade, getPercentageDragged: getSnapPointsPercentageDragged } = useSnapPoints({
    snapPoints,
    activeSnapPointProp,
    setActiveSnapPointProp,
    drawerRef,
    fadeFromIndex,
    overlayRef,
    onSnapPointChange,
    direction,
    container,
    snapToSequentialPoint
  });
  usePreventScroll({
    isDisabled: !isOpen || isDragging || !modal || justReleased || !hasBeenOpened || !repositionInputs || !disablePreventScroll
  });
  const { restorePositionSetting } = usePositionFixed({
    isOpen,
    modal,
    nested: nested != null ? nested : false,
    hasBeenOpened,
    preventScrollRestoration,
    noBodyStyles
  });
  function getScale() {
    return (window.innerWidth - WINDOW_TOP_OFFSET) / window.innerWidth;
  }
  function onPress(event) {
    var _drawerRef_current2, _drawerRef_current12;
    if (!dismissible && !snapPoints) return;
    if (drawerRef.current && !drawerRef.current.contains(event.target)) return;
    drawerHeightRef.current = ((_drawerRef_current2 = drawerRef.current) == null ? void 0 : _drawerRef_current2.getBoundingClientRect().height) || 0;
    drawerWidthRef.current = ((_drawerRef_current12 = drawerRef.current) == null ? void 0 : _drawerRef_current12.getBoundingClientRect().width) || 0;
    setIsDragging(true);
    dragStartTime.current = /* @__PURE__ */ new Date();
    if (isIOS()) {
      window.addEventListener("touchend", () => isAllowedToDrag.current = false, {
        once: true
      });
    }
    event.target.setPointerCapture(event.pointerId);
    pointerStart.current = isVertical(direction) ? event.pageY : event.pageX;
  }
  function shouldDrag(el, isDraggingInDirection) {
    var _window_getSelection;
    let element = el;
    const highlightedText = (_window_getSelection = window.getSelection()) == null ? void 0 : _window_getSelection.toString();
    const swipeAmount = drawerRef.current ? getTranslate(drawerRef.current, direction) : null;
    const date = /* @__PURE__ */ new Date();
    if (element.tagName === "SELECT") {
      return false;
    }
    if (element.hasAttribute("data-vaul-no-drag") || element.closest("[data-vaul-no-drag]")) {
      return false;
    }
    if (direction === "right" || direction === "left") {
      return true;
    }
    if (openTime.current && date.getTime() - openTime.current.getTime() < 500) {
      return false;
    }
    if (swipeAmount !== null) {
      if (direction === "bottom" ? swipeAmount > 0 : swipeAmount < 0) {
        return true;
      }
    }
    if (highlightedText && highlightedText.length > 0) {
      return false;
    }
    if (lastTimeDragPrevented.current && date.getTime() - lastTimeDragPrevented.current.getTime() < scrollLockTimeout && swipeAmount === 0) {
      lastTimeDragPrevented.current = date;
      return false;
    }
    if (isDraggingInDirection) {
      lastTimeDragPrevented.current = date;
      return false;
    }
    while (element) {
      if (element.scrollHeight > element.clientHeight) {
        if (element.scrollTop !== 0) {
          lastTimeDragPrevented.current = /* @__PURE__ */ new Date();
          return false;
        }
        if (element.getAttribute("role") === "dialog") {
          return true;
        }
      }
      element = element.parentNode;
    }
    return true;
  }
  function onDrag(event) {
    if (!drawerRef.current) {
      return;
    }
    if (isDragging) {
      const directionMultiplier = direction === "bottom" || direction === "right" ? 1 : -1;
      const draggedDistance = (pointerStart.current - (isVertical(direction) ? event.pageY : event.pageX)) * directionMultiplier;
      const isDraggingInDirection = draggedDistance > 0;
      const noCloseSnapPointsPreCondition = snapPoints && !dismissible && !isDraggingInDirection;
      if (noCloseSnapPointsPreCondition && activeSnapPointIndex === 0) return;
      const absDraggedDistance = Math.abs(draggedDistance);
      const wrapper = document.querySelector("[data-vaul-drawer-wrapper]");
      const drawerDimension = direction === "bottom" || direction === "top" ? drawerHeightRef.current : drawerWidthRef.current;
      let percentageDragged = absDraggedDistance / drawerDimension;
      const snapPointPercentageDragged = getSnapPointsPercentageDragged(absDraggedDistance, isDraggingInDirection);
      if (snapPointPercentageDragged !== null) {
        percentageDragged = snapPointPercentageDragged;
      }
      if (noCloseSnapPointsPreCondition && percentageDragged >= 1) {
        return;
      }
      if (!isAllowedToDrag.current && !shouldDrag(event.target, isDraggingInDirection)) return;
      drawerRef.current.classList.add(DRAG_CLASS);
      isAllowedToDrag.current = true;
      set(drawerRef.current, {
        transition: "none"
      });
      set(overlayRef.current, {
        transition: "none"
      });
      if (snapPoints) {
        onDragSnapPoints({
          draggedDistance
        });
      }
      if (isDraggingInDirection && !snapPoints) {
        const dampenedDraggedDistance = dampenValue(draggedDistance);
        const translateValue = Math.min(dampenedDraggedDistance * -1, 0) * directionMultiplier;
        set(drawerRef.current, {
          transform: isVertical(direction) ? `translate3d(0, ${translateValue}px, 0)` : `translate3d(${translateValue}px, 0, 0)`
        });
        return;
      }
      const opacityValue = 1 - percentageDragged;
      if (shouldFade || fadeFromIndex && activeSnapPointIndex === fadeFromIndex - 1) {
        onDragProp == null ? void 0 : onDragProp(event, percentageDragged);
        set(overlayRef.current, {
          opacity: `${opacityValue}`,
          transition: "none"
        }, true);
      }
      if (wrapper && overlayRef.current && shouldScaleBackground) {
        const scaleValue = Math.min(getScale() + percentageDragged * (1 - getScale()), 1);
        const borderRadiusValue = 8 - percentageDragged * 8;
        const translateValue = Math.max(0, 14 - percentageDragged * 14);
        set(wrapper, {
          borderRadius: `${borderRadiusValue}px`,
          transform: isVertical(direction) ? `scale(${scaleValue}) translate3d(0, ${translateValue}px, 0)` : `scale(${scaleValue}) translate3d(${translateValue}px, 0, 0)`,
          transition: "none"
        }, true);
      }
      if (!snapPoints) {
        const translateValue = absDraggedDistance * directionMultiplier;
        set(drawerRef.current, {
          transform: isVertical(direction) ? `translate3d(0, ${translateValue}px, 0)` : `translate3d(${translateValue}px, 0, 0)`
        });
      }
    }
  }
  React__default.useEffect(() => {
    window.requestAnimationFrame(() => {
      shouldAnimate.current = true;
    });
  }, []);
  React__default.useEffect(() => {
    var _window_visualViewport;
    function onVisualViewportChange() {
      if (!drawerRef.current || !repositionInputs) return;
      const focusedElement = document.activeElement;
      if (isInput(focusedElement) || keyboardIsOpen.current) {
        var _window_visualViewport2;
        const visualViewportHeight = ((_window_visualViewport2 = window.visualViewport) == null ? void 0 : _window_visualViewport2.height) || 0;
        const totalHeight = window.innerHeight;
        let diffFromInitial = totalHeight - visualViewportHeight;
        const drawerHeight = drawerRef.current.getBoundingClientRect().height || 0;
        const isTallEnough = drawerHeight > totalHeight * 0.8;
        if (!initialDrawerHeight.current) {
          initialDrawerHeight.current = drawerHeight;
        }
        const offsetFromTop = drawerRef.current.getBoundingClientRect().top;
        if (Math.abs(previousDiffFromInitial.current - diffFromInitial) > 60) {
          keyboardIsOpen.current = !keyboardIsOpen.current;
        }
        if (snapPoints && snapPoints.length > 0 && snapPointsOffset && activeSnapPointIndex) {
          const activeSnapPointHeight = snapPointsOffset[activeSnapPointIndex] || 0;
          diffFromInitial += activeSnapPointHeight;
        }
        previousDiffFromInitial.current = diffFromInitial;
        if (drawerHeight > visualViewportHeight || keyboardIsOpen.current) {
          const height = drawerRef.current.getBoundingClientRect().height;
          let newDrawerHeight = height;
          if (height > visualViewportHeight) {
            newDrawerHeight = visualViewportHeight - (isTallEnough ? offsetFromTop : WINDOW_TOP_OFFSET);
          }
          if (fixed) {
            drawerRef.current.style.height = `${height - Math.max(diffFromInitial, 0)}px`;
          } else {
            drawerRef.current.style.height = `${Math.max(newDrawerHeight, visualViewportHeight - offsetFromTop)}px`;
          }
        } else if (!isMobileFirefox()) {
          drawerRef.current.style.height = `${initialDrawerHeight.current}px`;
        }
        if (snapPoints && snapPoints.length > 0 && !keyboardIsOpen.current) {
          drawerRef.current.style.bottom = `0px`;
        } else {
          drawerRef.current.style.bottom = `${Math.max(diffFromInitial, 0)}px`;
        }
      }
    }
    (_window_visualViewport = window.visualViewport) == null ? void 0 : _window_visualViewport.addEventListener("resize", onVisualViewportChange);
    return () => {
      var _window_visualViewport2;
      return (_window_visualViewport2 = window.visualViewport) == null ? void 0 : _window_visualViewport2.removeEventListener("resize", onVisualViewportChange);
    };
  }, [
    activeSnapPointIndex,
    snapPoints,
    snapPointsOffset
  ]);
  function closeDrawer(fromWithin) {
    cancelDrag();
    onClose == null ? void 0 : onClose();
    if (!fromWithin) {
      setIsOpen(false);
    }
    setTimeout(() => {
      if (snapPoints) {
        setActiveSnapPoint(snapPoints[0]);
      }
    }, TRANSITIONS.DURATION * 1e3);
  }
  function resetDrawer() {
    if (!drawerRef.current) return;
    const wrapper = document.querySelector("[data-vaul-drawer-wrapper]");
    const currentSwipeAmount = getTranslate(drawerRef.current, direction);
    set(drawerRef.current, {
      transform: "translate3d(0, 0, 0)",
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(",")})`
    });
    set(overlayRef.current, {
      transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(",")})`,
      opacity: "1"
    });
    if (shouldScaleBackground && currentSwipeAmount && currentSwipeAmount > 0 && isOpen) {
      set(wrapper, {
        borderRadius: `${BORDER_RADIUS}px`,
        overflow: "hidden",
        ...isVertical(direction) ? {
          transform: `scale(${getScale()}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0)`,
          transformOrigin: "top"
        } : {
          transform: `scale(${getScale()}) translate3d(calc(env(safe-area-inset-top) + 14px), 0, 0)`,
          transformOrigin: "left"
        },
        transitionProperty: "transform, border-radius",
        transitionDuration: `${TRANSITIONS.DURATION}s`,
        transitionTimingFunction: `cubic-bezier(${TRANSITIONS.EASE.join(",")})`
      }, true);
    }
  }
  function cancelDrag() {
    if (!isDragging || !drawerRef.current) return;
    drawerRef.current.classList.remove(DRAG_CLASS);
    isAllowedToDrag.current = false;
    setIsDragging(false);
    dragEndTime.current = /* @__PURE__ */ new Date();
  }
  function onRelease(event) {
    if (!isDragging || !drawerRef.current) return;
    drawerRef.current.classList.remove(DRAG_CLASS);
    isAllowedToDrag.current = false;
    setIsDragging(false);
    dragEndTime.current = /* @__PURE__ */ new Date();
    const swipeAmount = getTranslate(drawerRef.current, direction);
    if (!event || !shouldDrag(event.target, false) || !swipeAmount || Number.isNaN(swipeAmount)) return;
    if (dragStartTime.current === null) return;
    const timeTaken = dragEndTime.current.getTime() - dragStartTime.current.getTime();
    const distMoved = pointerStart.current - (isVertical(direction) ? event.pageY : event.pageX);
    const velocity = Math.abs(distMoved) / timeTaken;
    if (velocity > 0.05) {
      setJustReleased(true);
      setTimeout(() => {
        setJustReleased(false);
      }, 200);
    }
    if (snapPoints) {
      const directionMultiplier = direction === "bottom" || direction === "right" ? 1 : -1;
      onReleaseSnapPoints({
        draggedDistance: distMoved * directionMultiplier,
        closeDrawer,
        velocity,
        dismissible
      });
      onReleaseProp == null ? void 0 : onReleaseProp(event, true);
      return;
    }
    if (direction === "bottom" || direction === "right" ? distMoved > 0 : distMoved < 0) {
      resetDrawer();
      onReleaseProp == null ? void 0 : onReleaseProp(event, true);
      return;
    }
    if (velocity > VELOCITY_THRESHOLD) {
      closeDrawer();
      onReleaseProp == null ? void 0 : onReleaseProp(event, false);
      return;
    }
    var _drawerRef_current_getBoundingClientRect_height;
    const visibleDrawerHeight = Math.min((_drawerRef_current_getBoundingClientRect_height = drawerRef.current.getBoundingClientRect().height) != null ? _drawerRef_current_getBoundingClientRect_height : 0, window.innerHeight);
    var _drawerRef_current_getBoundingClientRect_width;
    const visibleDrawerWidth = Math.min((_drawerRef_current_getBoundingClientRect_width = drawerRef.current.getBoundingClientRect().width) != null ? _drawerRef_current_getBoundingClientRect_width : 0, window.innerWidth);
    const isHorizontalSwipe = direction === "left" || direction === "right";
    if (Math.abs(swipeAmount) >= (isHorizontalSwipe ? visibleDrawerWidth : visibleDrawerHeight) * closeThreshold) {
      closeDrawer();
      onReleaseProp == null ? void 0 : onReleaseProp(event, false);
      return;
    }
    onReleaseProp == null ? void 0 : onReleaseProp(event, true);
    resetDrawer();
  }
  React__default.useEffect(() => {
    if (isOpen) {
      set(document.documentElement, {
        scrollBehavior: "auto"
      });
      openTime.current = /* @__PURE__ */ new Date();
    }
    return () => {
      reset(document.documentElement, "scrollBehavior");
    };
  }, [
    isOpen
  ]);
  function onNestedOpenChange(o) {
    const scale = o ? (window.innerWidth - NESTED_DISPLACEMENT) / window.innerWidth : 1;
    const initialTranslate = o ? -NESTED_DISPLACEMENT : 0;
    if (nestedOpenChangeTimer.current) {
      window.clearTimeout(nestedOpenChangeTimer.current);
    }
    set(drawerRef.current, {
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(",")})`,
      transform: isVertical(direction) ? `scale(${scale}) translate3d(0, ${initialTranslate}px, 0)` : `scale(${scale}) translate3d(${initialTranslate}px, 0, 0)`
    });
    if (!o && drawerRef.current) {
      nestedOpenChangeTimer.current = setTimeout(() => {
        const translateValue = getTranslate(drawerRef.current, direction);
        set(drawerRef.current, {
          transition: "none",
          transform: isVertical(direction) ? `translate3d(0, ${translateValue}px, 0)` : `translate3d(${translateValue}px, 0, 0)`
        });
      }, 500);
    }
  }
  function onNestedDrag(_event, percentageDragged) {
    if (percentageDragged < 0) return;
    const initialScale = (window.innerWidth - NESTED_DISPLACEMENT) / window.innerWidth;
    const newScale = initialScale + percentageDragged * (1 - initialScale);
    const newTranslate = -NESTED_DISPLACEMENT + percentageDragged * NESTED_DISPLACEMENT;
    set(drawerRef.current, {
      transform: isVertical(direction) ? `scale(${newScale}) translate3d(0, ${newTranslate}px, 0)` : `scale(${newScale}) translate3d(${newTranslate}px, 0, 0)`,
      transition: "none"
    });
  }
  function onNestedRelease(_event, o) {
    const dim = isVertical(direction) ? window.innerHeight : window.innerWidth;
    const scale = o ? (dim - NESTED_DISPLACEMENT) / dim : 1;
    const translate = o ? -NESTED_DISPLACEMENT : 0;
    if (o) {
      set(drawerRef.current, {
        transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(",")})`,
        transform: isVertical(direction) ? `scale(${scale}) translate3d(0, ${translate}px, 0)` : `scale(${scale}) translate3d(${translate}px, 0, 0)`
      });
    }
  }
  React__default.useEffect(() => {
    if (!modal) {
      window.requestAnimationFrame(() => {
        document.body.style.pointerEvents = "auto";
      });
    }
  }, [
    modal
  ]);
  return /* @__PURE__ */ React__default.createElement(Root$1, {
    defaultOpen,
    onOpenChange: (open) => {
      if (!dismissible && !open) return;
      if (open) {
        setHasBeenOpened(true);
      } else {
        closeDrawer(true);
      }
      setIsOpen(open);
    },
    open: isOpen
  }, /* @__PURE__ */ React__default.createElement(DrawerContext.Provider, {
    value: {
      activeSnapPoint,
      snapPoints,
      setActiveSnapPoint,
      drawerRef,
      overlayRef,
      onOpenChange,
      onPress,
      onRelease,
      onDrag,
      dismissible,
      shouldAnimate,
      handleOnly,
      isOpen,
      isDragging,
      shouldFade,
      closeDrawer,
      onNestedDrag,
      onNestedOpenChange,
      onNestedRelease,
      keyboardIsOpen,
      modal,
      snapPointsOffset,
      activeSnapPointIndex,
      direction,
      shouldScaleBackground,
      setBackgroundColorOnScale,
      noBodyStyles,
      container,
      autoFocus
    }
  }, children));
}
const Overlay = /* @__PURE__ */ React__default.forwardRef(function({ ...rest }, ref) {
  const { overlayRef, snapPoints, onRelease, shouldFade, isOpen, modal, shouldAnimate } = useDrawerContext();
  const composedRef = useComposedRefs(ref, overlayRef);
  const hasSnapPoints = snapPoints && snapPoints.length > 0;
  if (!modal) {
    return null;
  }
  const onMouseUp = React__default.useCallback((event) => onRelease(event), [
    onRelease
  ]);
  return /* @__PURE__ */ React__default.createElement(Overlay$1, {
    onMouseUp,
    ref: composedRef,
    "data-vaul-overlay": "",
    "data-vaul-snap-points": isOpen && hasSnapPoints ? "true" : "false",
    "data-vaul-snap-points-overlay": isOpen && shouldFade ? "true" : "false",
    "data-vaul-animate": (shouldAnimate == null ? void 0 : shouldAnimate.current) ? "true" : "false",
    ...rest
  });
});
Overlay.displayName = "Drawer.Overlay";
const Content = /* @__PURE__ */ React__default.forwardRef(function({ onPointerDownOutside, style, onOpenAutoFocus, ...rest }, ref) {
  const { drawerRef, onPress, onRelease, onDrag, keyboardIsOpen, snapPointsOffset, activeSnapPointIndex, modal, isOpen, direction, snapPoints, container, handleOnly, shouldAnimate, autoFocus } = useDrawerContext();
  const [delayedSnapPoints, setDelayedSnapPoints] = React__default.useState(false);
  const composedRef = useComposedRefs(ref, drawerRef);
  const pointerStartRef = React__default.useRef(null);
  const lastKnownPointerEventRef = React__default.useRef(null);
  const wasBeyondThePointRef = React__default.useRef(false);
  const hasSnapPoints = snapPoints && snapPoints.length > 0;
  useScaleBackground();
  const isDeltaInDirection = (delta, direction2, threshold = 0) => {
    if (wasBeyondThePointRef.current) return true;
    const deltaY = Math.abs(delta.y);
    const deltaX = Math.abs(delta.x);
    const isDeltaX = deltaX > deltaY;
    const dFactor = [
      "bottom",
      "right"
    ].includes(direction2) ? 1 : -1;
    if (direction2 === "left" || direction2 === "right") {
      const isReverseDirection = delta.x * dFactor < 0;
      if (!isReverseDirection && deltaX >= 0 && deltaX <= threshold) {
        return isDeltaX;
      }
    } else {
      const isReverseDirection = delta.y * dFactor < 0;
      if (!isReverseDirection && deltaY >= 0 && deltaY <= threshold) {
        return !isDeltaX;
      }
    }
    wasBeyondThePointRef.current = true;
    return true;
  };
  React__default.useEffect(() => {
    if (hasSnapPoints) {
      window.requestAnimationFrame(() => {
        setDelayedSnapPoints(true);
      });
    }
  }, []);
  function handleOnPointerUp(event) {
    pointerStartRef.current = null;
    wasBeyondThePointRef.current = false;
    onRelease(event);
  }
  return /* @__PURE__ */ React__default.createElement(Content$1, {
    "data-vaul-drawer-direction": direction,
    "data-vaul-drawer": "",
    "data-vaul-delayed-snap-points": delayedSnapPoints ? "true" : "false",
    "data-vaul-snap-points": isOpen && hasSnapPoints ? "true" : "false",
    "data-vaul-custom-container": container ? "true" : "false",
    "data-vaul-animate": (shouldAnimate == null ? void 0 : shouldAnimate.current) ? "true" : "false",
    ...rest,
    ref: composedRef,
    style: snapPointsOffset && snapPointsOffset.length > 0 ? {
      "--snap-point-height": `${snapPointsOffset[activeSnapPointIndex != null ? activeSnapPointIndex : 0]}px`,
      ...style
    } : style,
    onPointerDown: (event) => {
      if (handleOnly) return;
      rest.onPointerDown == null ? void 0 : rest.onPointerDown.call(rest, event);
      pointerStartRef.current = {
        x: event.pageX,
        y: event.pageY
      };
      onPress(event);
    },
    onOpenAutoFocus: (e) => {
      onOpenAutoFocus == null ? void 0 : onOpenAutoFocus(e);
      if (!autoFocus) {
        e.preventDefault();
      }
    },
    onPointerDownOutside: (e) => {
      onPointerDownOutside == null ? void 0 : onPointerDownOutside(e);
      if (!modal || e.defaultPrevented) {
        e.preventDefault();
        return;
      }
      if (keyboardIsOpen.current) {
        keyboardIsOpen.current = false;
      }
    },
    onFocusOutside: (e) => {
      if (!modal) {
        e.preventDefault();
        return;
      }
    },
    onPointerMove: (event) => {
      lastKnownPointerEventRef.current = event;
      if (handleOnly) return;
      rest.onPointerMove == null ? void 0 : rest.onPointerMove.call(rest, event);
      if (!pointerStartRef.current) return;
      const yPosition = event.pageY - pointerStartRef.current.y;
      const xPosition = event.pageX - pointerStartRef.current.x;
      const swipeStartThreshold = event.pointerType === "touch" ? 10 : 2;
      const delta = {
        x: xPosition,
        y: yPosition
      };
      const isAllowedToSwipe = isDeltaInDirection(delta, direction, swipeStartThreshold);
      if (isAllowedToSwipe) onDrag(event);
      else if (Math.abs(xPosition) > swipeStartThreshold || Math.abs(yPosition) > swipeStartThreshold) {
        pointerStartRef.current = null;
      }
    },
    onPointerUp: (event) => {
      rest.onPointerUp == null ? void 0 : rest.onPointerUp.call(rest, event);
      pointerStartRef.current = null;
      wasBeyondThePointRef.current = false;
      onRelease(event);
    },
    onPointerOut: (event) => {
      rest.onPointerOut == null ? void 0 : rest.onPointerOut.call(rest, event);
      handleOnPointerUp(lastKnownPointerEventRef.current);
    },
    onContextMenu: (event) => {
      rest.onContextMenu == null ? void 0 : rest.onContextMenu.call(rest, event);
      if (lastKnownPointerEventRef.current) {
        handleOnPointerUp(lastKnownPointerEventRef.current);
      }
    }
  });
});
Content.displayName = "Drawer.Content";
const LONG_HANDLE_PRESS_TIMEOUT = 250;
const DOUBLE_TAP_TIMEOUT = 120;
const Handle = /* @__PURE__ */ React__default.forwardRef(function({ preventCycle = false, children, ...rest }, ref) {
  const { closeDrawer, isDragging, snapPoints, activeSnapPoint, setActiveSnapPoint, dismissible, handleOnly, isOpen, onPress, onDrag } = useDrawerContext();
  const closeTimeoutIdRef = React__default.useRef(null);
  const shouldCancelInteractionRef = React__default.useRef(false);
  function handleStartCycle() {
    if (shouldCancelInteractionRef.current) {
      handleCancelInteraction();
      return;
    }
    window.setTimeout(() => {
      handleCycleSnapPoints();
    }, DOUBLE_TAP_TIMEOUT);
  }
  function handleCycleSnapPoints() {
    if (isDragging || preventCycle || shouldCancelInteractionRef.current) {
      handleCancelInteraction();
      return;
    }
    handleCancelInteraction();
    if (!snapPoints || snapPoints.length === 0) {
      if (!dismissible) {
        closeDrawer();
      }
      return;
    }
    const isLastSnapPoint = activeSnapPoint === snapPoints[snapPoints.length - 1];
    if (isLastSnapPoint && dismissible) {
      closeDrawer();
      return;
    }
    const currentSnapIndex = snapPoints.findIndex((point) => point === activeSnapPoint);
    if (currentSnapIndex === -1) return;
    const nextSnapPoint = snapPoints[currentSnapIndex + 1];
    setActiveSnapPoint(nextSnapPoint);
  }
  function handleStartInteraction() {
    closeTimeoutIdRef.current = window.setTimeout(() => {
      shouldCancelInteractionRef.current = true;
    }, LONG_HANDLE_PRESS_TIMEOUT);
  }
  function handleCancelInteraction() {
    if (closeTimeoutIdRef.current) {
      window.clearTimeout(closeTimeoutIdRef.current);
    }
    shouldCancelInteractionRef.current = false;
  }
  return /* @__PURE__ */ React__default.createElement("div", {
    onClick: handleStartCycle,
    onPointerCancel: handleCancelInteraction,
    onPointerDown: (e) => {
      if (handleOnly) onPress(e);
      handleStartInteraction();
    },
    onPointerMove: (e) => {
      if (handleOnly) onDrag(e);
    },
    // onPointerUp is already handled by the content component
    ref,
    "data-vaul-drawer-visible": isOpen ? "true" : "false",
    "data-vaul-handle": "",
    "aria-hidden": "true",
    ...rest
  }, /* @__PURE__ */ React__default.createElement("span", {
    "data-vaul-handle-hitarea": "",
    "aria-hidden": "true"
  }, children));
});
Handle.displayName = "Drawer.Handle";
function Portal(props) {
  const context = useDrawerContext();
  const { container = context.container, ...portalProps } = props;
  return /* @__PURE__ */ React__default.createElement(Portal$1, {
    container,
    ...portalProps
  });
}
const Drawer$1 = {
  Root,
  Content,
  Overlay,
  Portal,
  Title
};
function Drawer({
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Drawer$1.Root, { "data-slot": "drawer", ...props });
}
function DrawerPortal({
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Drawer$1.Portal, { "data-slot": "drawer-portal", ...props });
}
function DrawerOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Drawer$1.Overlay,
    {
      "data-slot": "drawer-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      ),
      ...props
    }
  );
}
function DrawerContent({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DrawerPortal, { "data-slot": "drawer-portal", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DrawerOverlay, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Drawer$1.Content,
      {
        "data-slot": "drawer-content",
        className: cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
          className
        ),
        ...props,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" }),
          children
        ]
      }
    )
  ] });
}
function DrawerHeader({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "drawer-header",
      className: cn(
        "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      ),
      ...props
    }
  );
}
function DrawerFooter({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "drawer-footer",
      className: cn("mt-auto flex flex-col gap-2 p-4", className),
      ...props
    }
  );
}
function DrawerTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Drawer$1.Title,
    {
      "data-slot": "drawer-title",
      className: cn("text-foreground font-semibold", className),
      ...props
    }
  );
}
const QUERY_KEY = ["documents"];
const FRONTEND_TO_BACKEND = {
  registration: DocumentType.registration,
  licence: DocumentType.licence,
  invoice: DocumentType.invoice,
  other: DocumentType.other
};
function useDocuments() {
  const { actor, isFetching: actorFetching } = useActor();
  const qc = useQueryClient();
  const {
    data: documents = [],
    isLoading,
    error
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.listDriverDocuments();
      return raw.filter((r) => !r.deleted).map((r) => ({
        ...r,
        docType: toDocumentType(r.docType)
      }));
    },
    enabled: !!actor && !actorFetching
  });
  const uploadMut = useMutation({
    mutationFn: async ({
      storageRef,
      docType,
      fileName,
      notes
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.uploadDocument(
        storageRef,
        FRONTEND_TO_BACKEND[docType],
        fileName,
        notes
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      ue.success("Document uploaded successfully.");
    },
    onError: (err) => ue.error(err.message || "Failed to upload document.")
  });
  const deleteMut = useMutation({
    mutationFn: async (docId) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.deleteDocument(docId);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      ue.success("Document removed.");
    },
    onError: (err) => ue.error(err.message || "Failed to remove document.")
  });
  const addNoteMut = useMutation({
    mutationFn: async ({ docId, note }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.addDocumentNote(docId, note);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      ue.success("Note saved.");
    },
    onError: (err) => ue.error(err.message || "Failed to save note.")
  });
  return {
    documents,
    isLoading: isLoading || actorFetching,
    error,
    uploadDocument: uploadMut.mutate,
    isUploading: uploadMut.isPending,
    deleteDocument: deleteMut.mutate,
    isDeleting: deleteMut.isPending,
    addNote: addNoteMut.mutate,
    isAddingNote: addNoteMut.isPending
  };
}
function useRequestMarkdownConversion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (storageRef) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.requestMarkdownConversion(storageRef);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      ue.success("Nduna is starting to read the document...");
    },
    onError: (err) => ue.error(err.message || "Failed to request conversion.")
  });
}
function useDocumentMarkdown(storageRef) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["document-markdown", storageRef],
    queryFn: async () => {
      if (!actor || !storageRef) return "";
      const result = await actor.getDocumentMarkdown(storageRef);
      if ("err" in result) throw new Error(result.err);
      return result.ok ?? "";
    },
    enabled: !!actor && !actorFetching && storageRef !== null,
    staleTime: 6e4
  });
}
function renderMarkdown(md) {
  return md.replace(/^### (.+)$/gm, "<h3>$1</h3>").replace(/^## (.+)$/gm, "<h2>$1</h2>").replace(/^# (.+)$/gm, "<h1>$1</h1>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/^[-*] (.+)$/gm, "<li>$1</li>").replace(/^---$/gm, "<hr />").replace(/\n\n/g, "</p><p>").replace(/^/, "<p>").replace(/$/, "</p>").replace(/<p>(<h[1-3]>)/g, "$1").replace(/(<\/h[1-3]>)<\/p>/g, "$1").replace(/<p>(<li>)/g, "<ul>$1").replace(/(<\/li>)<\/p>/g, "$1</ul>").replace(/<p>(<hr \/>)<\/p>/g, "$1");
}
function MarkdownContent({
  storageRef,
  filename,
  docType,
  onClose,
  onAskNduna
}) {
  const { data: markdown, isLoading, error } = useDocumentMarkdown(storageRef);
  const handleAskNduna = reactExports.useCallback(() => {
    if (onAskNduna) {
      onAskNduna(`I want to talk about my ${docType} document: ${filename}`);
    }
    onClose();
  }, [onAskNduna, docType, filename, onClose]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-5 h-5 text-burnt-orange shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "What Nduna sees in" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "p",
      {
        className: "font-display font-bold text-lg text-burnt-orange leading-tight truncate mb-4",
        title: filename,
        children: filename
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex-1 overflow-y-auto rounded-xl bg-muted/30 border border-border/50 p-4 min-h-[200px] max-h-[55vh] text-sm",
        "data-ocid": "document_vault.markdown_preview",
        children: [
          isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: ["a", "b", "c", "d", "e", "f"].map((k, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Skeleton,
            {
              className: `h-3.5 rounded skeleton-loader ${i % 3 === 2 ? "w-2/3" : "w-full"}`
            },
            k
          )) }),
          error && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-8",
              "data-ocid": "document_vault.markdown_error_state",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-8 h-8 text-destructive/60" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-sm", children: "Couldn't load document content. Try again in a moment." })
              ]
            }
          ),
          !isLoading && !error && markdown && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "prose-sm text-foreground leading-relaxed [&_h1]:font-display [&_h1]:text-burnt-orange [&_h1]:font-bold [&_h1]:text-base [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:font-display [&_h2]:text-gold [&_h2]:font-semibold [&_h2]:text-sm [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:text-sm [&_h3]:mt-2.5 [&_h3]:mb-1 [&_strong]:text-foreground [&_strong]:font-semibold [&_em]:text-muted-foreground [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_ul]:pl-4 [&_ul]:my-2 [&_li]:my-0.5 [&_li]:list-disc [&_li]:text-muted-foreground [&_hr]:border-border/40 [&_hr]:my-3 [&_p]:mb-2 [&_p]:text-muted-foreground",
              dangerouslySetInnerHTML: { __html: renderMarkdown(markdown) }
            }
          ),
          !isLoading && !error && !markdown && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full text-muted-foreground text-sm py-8", children: "No readable content available yet." })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-4 pt-4 border-t border-border/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: onClose,
          className: "text-muted-foreground",
          "data-ocid": "document_vault.markdown_close_button",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4 mr-1.5" }),
            "Close"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          size: "sm",
          onClick: handleAskNduna,
          className: "flex-1 bg-burnt-orange hover:bg-burnt-orange/90 text-white font-semibold",
          "data-ocid": "document_vault.ask_nduna_button",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-4 h-4 mr-1.5" }),
            "Ask Nduna about this document"
          ]
        }
      )
    ] })
  ] });
}
function DocumentMarkdownModal({
  isOpen,
  onClose,
  storageRef,
  filename,
  docType,
  onAskNduna
}) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const contentProps = { storageRef, filename, docType, onClose, onAskNduna };
  if (isMobile) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Drawer, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      DrawerContent,
      {
        className: "bg-card border-border rounded-t-2xl px-4 pb-6 pt-2",
        "data-ocid": "document_vault.markdown_sheet",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DrawerHeader, { className: "sr-only", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DrawerTitle, { children: "What Nduna sees" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownContent, { ...contentProps }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DrawerFooter, { className: "sr-only" })
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      className: "bg-card border-border rounded-2xl max-w-2xl w-full p-6 flex flex-col",
      "data-ocid": "document_vault.markdown_dialog",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { className: "sr-only", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "What Nduna sees" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownContent, { ...contentProps }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { className: "sr-only" })
      ]
    }
  ) });
}
const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "registration", label: "Registration" },
  { value: "licence", label: "Licence" },
  { value: "invoice", label: "Invoice" },
  { value: "other", label: "Other" }
];
const DOC_TYPE_CFG = {
  registration: {
    color: "bg-primary/15 text-primary border-primary/30",
    icon: "🚗"
  },
  licence: {
    color: "bg-burnt-orange/10 text-burnt-orange border-burnt-orange/30",
    icon: "📋"
  },
  invoice: {
    color: "bg-success/10 text-success border-success/30",
    icon: "🧾"
  },
  other: {
    color: "bg-muted/50 text-muted-foreground border-border",
    icon: "📄"
  }
};
function formatDate(ts) {
  const ms = Number(ts) / 1e6;
  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
function NdunaReadBadge({
  doc,
  onRequestConversion,
  isRequesting,
  onViewMarkdown
}) {
  const status = doc.markdownStatus;
  if (!status) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "ghost",
        size: "sm",
        className: "h-7 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-2.5 gap-1.5",
        onClick: () => onRequestConversion(doc.storageRef),
        disabled: isRequesting,
        "data-ocid": `document_vault.ask_nduna_read_button.${doc.id}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-3.5 h-3.5 shrink-0" }),
          "Ask Nduna to read"
        ]
      }
    );
  }
  if (status === MarkdownStatus.pending || status === MarkdownStatus.converting) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 animate-pulse",
        "data-ocid": `document_vault.nduna_reading_badge.${doc.id}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3 h-3 text-gold animate-spin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-gold", children: "Nduna is reading..." })
        ]
      }
    );
  }
  if (status === MarkdownStatus.ready) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-burnt-orange/10 border border-burnt-orange/30 hover:bg-burnt-orange/20 transition-colors cursor-pointer",
        onClick: () => onViewMarkdown(
          doc.storageRef,
          doc.fileName,
          DOCUMENT_TYPE_LABELS[doc.docType]
        ),
        "data-ocid": `document_vault.nduna_ready_badge.${doc.id}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-3 h-3 text-burnt-orange" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-burnt-orange", children: "Nduna can read this ✓" })
        ]
      }
    );
  }
  if (status === MarkdownStatus.failed) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border hover:bg-muted transition-colors cursor-pointer",
        onClick: () => onRequestConversion(doc.storageRef),
        disabled: isRequesting,
        "data-ocid": `document_vault.conversion_failed_badge.${doc.id}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-3 h-3 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Conversion failed — retry" })
        ]
      }
    );
  }
  if (status === MarkdownStatus.unsupported) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/40 border border-border",
        "data-ocid": `document_vault.unsupported_badge.${doc.id}`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Format not supported" })
      }
    );
  }
  return null;
}
function DocumentCard({
  doc,
  index,
  onDelete,
  onRequestConversion,
  isRequesting,
  onViewMarkdown
}) {
  const cfg = DOC_TYPE_CFG[doc.docType] ?? DOC_TYPE_CFG.other;
  const label = DOCUMENT_TYPE_LABELS[doc.docType];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "bg-card border border-border rounded-xl p-4 shadow-card card-hover-lift animate-fade-up flex flex-col gap-3",
      style: { animationDelay: `${index * 60}ms` },
      "data-ocid": `document_vault.item.${index + 1}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl shrink-0", children: cfg.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "p",
                {
                  className: "font-semibold text-sm text-foreground truncate",
                  title: doc.fileName,
                  children: doc.fileName
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                formatDate(doc.uploadedAt)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `text-xs shrink-0 border ${cfg.color}`, children: label })
        ] }),
        doc.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(StickyNote, { className: "w-3.5 h-3.5 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-clamp-2", children: doc.notes })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          NdunaReadBadge,
          {
            doc,
            onRequestConversion,
            isRequesting,
            onViewMarkdown
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 pt-1 border-t border-border/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              asChild: true,
              variant: "ghost",
              size: "sm",
              className: "flex-1 text-xs font-semibold text-muted-foreground hover:text-foreground",
              "data-ocid": `document_vault.download_button.${index + 1}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: `/api/storage/${encodeURIComponent(doc.storageRef)}`,
                  download: doc.fileName,
                  target: "_blank",
                  rel: "noreferrer",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-3.5 h-3.5 mr-1.5" }),
                    "Download"
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "text-xs font-semibold text-destructive/70 hover:text-destructive hover:bg-destructive/10",
              onClick: () => onDelete(doc.id, doc.fileName),
              "data-ocid": `document_vault.delete_button.${index + 1}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3.5 h-3.5 mr-1" }),
                "Delete"
              ]
            }
          )
        ] })
      ]
    }
  );
}
function DocumentListSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: ["a", "b", "c"].map((k) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "bg-card border border-border rounded-xl p-4 space-y-3",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-8 h-8 rounded-lg skeleton-loader" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3.5 w-3/4 rounded skeleton-loader" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-1/2 rounded skeleton-loader" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-7 w-36 rounded-full skeleton-loader" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-full rounded-lg skeleton-loader" })
      ]
    },
    k
  )) });
}
function DocumentList({
  docs,
  isLoading,
  onUploadClick,
  onAskNduna
}) {
  const [activeFilter, setActiveFilter] = reactExports.useState("all");
  const [confirmDelete, setConfirmDelete] = reactExports.useState(null);
  const [markdownModal, setMarkdownModal] = reactExports.useState(null);
  const { deleteDocument, isDeleting } = useDocuments();
  const requestConversionMut = useRequestMarkdownConversion();
  const filtered = activeFilter === "all" ? docs : docs.filter((d) => d.docType === activeFilter);
  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    deleteDocument(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
      onError: () => {
        ue.error("Failed to delete document.");
        setConfirmDelete(null);
      }
    });
  };
  const handleRequestConversion = (storageRef) => {
    requestConversionMut.mutate(storageRef);
  };
  const handleViewMarkdown = (storageRef, filename, docType) => {
    setMarkdownModal({ storageRef, filename, docType });
  };
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx(DocumentListSkeleton, {});
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", "data-ocid": "document_vault.list", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
      FILTER_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setActiveFilter(opt.value),
          className: `filter-btn ${activeFilter === opt.value ? "active" : ""}`,
          "data-ocid": `document_vault.filter.${opt.value}`,
          children: opt.label
        },
        opt.value
      )),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto text-xs text-muted-foreground shrink-0", children: [
        filtered.length,
        " document",
        filtered.length !== 1 ? "s" : ""
      ] })
    ] }),
    filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-card border border-dashed border-border rounded-2xl p-10 text-center animate-fade-up",
        "data-ocid": "document_vault.empty_state",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileSearch, { className: "w-8 h-8 text-primary/60" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-lg text-foreground mb-1.5", children: activeFilter === "all" ? "No documents yet" : `No ${activeFilter} documents` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed", children: activeFilter === "all" ? "Upload your Vehicle Registration and Operating Licence to get started." : `Upload a ${activeFilter} document using the panel above.` }),
          activeFilter === "all" && onUploadClick && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: onUploadClick,
              className: "mt-5 border-primary/40 text-primary hover:bg-primary/10",
              "data-ocid": "document_vault.empty_state_upload_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4 mr-2" }),
                "Upload your first document"
              ]
            }
          )
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: filtered.map((doc, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      DocumentCard,
      {
        doc,
        index: i,
        onDelete: (id, name) => setConfirmDelete({ id, name }),
        onRequestConversion: handleRequestConversion,
        isRequesting: requestConversionMut.isPending,
        onViewMarkdown: handleViewMarkdown
      },
      doc.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Dialog,
      {
        open: !!confirmDelete,
        onOpenChange: (open) => !open && setConfirmDelete(null),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "document_vault.delete_dialog", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Delete Document?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { className: "text-muted-foreground", children: [
              "Are you sure you want to delete",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: confirmDelete == null ? void 0 : confirmDelete.name }),
              "? This cannot be undone."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                onClick: () => setConfirmDelete(null),
                "data-ocid": "document_vault.delete_cancel_button",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "destructive",
                onClick: handleDeleteConfirm,
                disabled: isDeleting,
                "data-ocid": "document_vault.delete_confirm_button",
                children: isDeleting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
                  "Deleting..."
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                  "Yes, Delete"
                ] })
              }
            )
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DocumentMarkdownModal,
      {
        isOpen: !!markdownModal,
        onClose: () => setMarkdownModal(null),
        storageRef: (markdownModal == null ? void 0 : markdownModal.storageRef) ?? null,
        filename: (markdownModal == null ? void 0 : markdownModal.filename) ?? "",
        docType: (markdownModal == null ? void 0 : markdownModal.docType) ?? "",
        onAskNduna
      }
    )
  ] });
}
const DOC_TYPE_OPTIONS = [
  "registration",
  "licence",
  "invoice",
  "other"
];
const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
const MAX_BYTES = 10 * 1024 * 1024;
function DocumentUpload({ onSuccess }) {
  const [file, setFile] = reactExports.useState(null);
  const [docType, setDocType] = reactExports.useState("registration");
  const [notes, setNotes] = reactExports.useState("");
  const [isDragging, setIsDragging] = reactExports.useState(false);
  const [uploadDone, setUploadDone] = reactExports.useState(false);
  const fileRef = reactExports.useRef(null);
  const { uploadDocument, isUploading } = useDocuments();
  const handleFile = reactExports.useCallback((f) => {
    if (f.size > MAX_BYTES) {
      return;
    }
    setFile(f);
    setUploadDone(false);
  }, []);
  const handleDrop = reactExports.useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleInputChange = (e) => {
    var _a;
    const f = (_a = e.target.files) == null ? void 0 : _a[0];
    if (f) handleFile(f);
  };
  const handleUpload = () => {
    if (!file) return;
    const storageRef = `documents/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    uploadDocument(
      { storageRef, docType, fileName: file.name, notes: notes.trim() },
      {
        onSuccess: () => {
          setUploadDone(true);
          setFile(null);
          setNotes("");
          if (fileRef.current) fileRef.current.value = "";
          onSuccess == null ? void 0 : onSuccess();
          setTimeout(() => setUploadDone(false), 3e3);
        }
      }
    );
  };
  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setUploadDone(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", "data-ocid": "document_upload.panel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: fileRef,
        type: "file",
        accept: ACCEPTED_TYPES,
        className: "hidden",
        onChange: handleInputChange
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `drag-drop-zone ${isDragging ? "active" : ""}`,
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        "data-ocid": "document_upload.dropzone",
        children: file ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-primary" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground truncate", children: file.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
                (file.size / 1024).toFixed(0),
                " KB"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: clearFile,
              className: "shrink-0 text-muted-foreground hover:text-foreground transition-colors",
              "aria-label": "Remove file",
              "data-ocid": "document_upload.remove_file_button",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
            }
          )
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              var _a;
              return (_a = fileRef.current) == null ? void 0 : _a.click();
            },
            className: "w-full flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer",
            "data-ocid": "document_upload.browse_button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drag-drop-icon", children: "📄" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drag-drop-text", children: "Drop your document here" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drag-drop-hint", children: "or click to browse — PDF, JPG, PNG, DOC (max 10 MB)" })
            ]
          }
        )
      }
    ),
    uploadDone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-success text-sm font-medium px-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-4 h-4" }),
      "Document saved to your vault!"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Label,
        {
          htmlFor: "doc-type",
          className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide",
          children: "Document Type"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: docType,
          onValueChange: (v) => setDocType(v),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectTrigger,
              {
                id: "doc-type",
                className: "bg-muted/30 border-border",
                "data-ocid": "document_upload.type_select",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select document type" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: DOC_TYPE_OPTIONS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t, children: DOCUMENT_TYPE_LABELS[t] }, t)) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Label,
        {
          htmlFor: "doc-notes",
          className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide",
          children: [
            "Notes",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-normal text-xs normal-case", children: "(optional)" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          id: "doc-notes",
          placeholder: "e.g. Renewed April 2026, expires April 2028",
          value: notes,
          onChange: (e) => setNotes(e.target.value),
          rows: 2,
          className: "bg-muted/30 border-border resize-none text-sm",
          "data-ocid": "document_upload.notes_textarea"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        onClick: handleUpload,
        disabled: !file || isUploading,
        className: "w-full font-semibold bg-burnt-orange text-white border-0 hover:opacity-90 transition-opacity",
        "data-ocid": "document_upload.upload_button",
        children: isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
          "Saving to vault..."
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-4 h-4 mr-2" }),
          "Save to Document Vault"
        ] })
      }
    )
  ] });
}
const NDUNA_BANNER_KEY = "nduna_doc_banner_dismissed";
function UpgradePrompt() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "flex flex-col items-center justify-center min-h-[60vh] p-6",
      "data-ocid": "document_vault.upgrade_prompt",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card shadow-card border-border rounded-2xl p-10 max-w-md w-full text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-8 h-8 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "mb-4 bg-primary/15 text-primary border-primary/30 text-xs font-semibold", children: "Pro Driver — Tier 2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-bold text-foreground mb-2", children: "Upgrade to Unlock Document Vault" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-sm leading-relaxed mb-6", children: [
          "Upgrade to",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: "Tier 2 (Pro Driver)" }),
          " ",
          "to safely store your Vehicle Registration, Operating Licence, Tax Invoices, and more. Nduna can access your documents anytime."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 text-sm text-left mb-6", children: [
          "Store your key documents securely on the blockchain",
          "Nduna references your docs in chat automatically",
          "Download anytime, on any device"
        ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-2.5 text-muted-foreground",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-4 h-4 text-success shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item })
            ]
          },
          item
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            className: "w-full font-semibold",
            onClick: () => window.dispatchEvent(
              new CustomEvent("navigate-tab", { detail: "settings" })
            ),
            "data-ocid": "document_vault.upgrade_button",
            children: "View Plans & Upgrade — R530/month"
          }
        )
      ] })
    }
  );
}
function NdunaBanner({ onDismiss }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "relative flex items-start gap-3 px-4 py-3.5 bg-card border-l-4 border-burnt-orange rounded-xl shadow-sm",
      "data-ocid": "document_vault.nduna_banner",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 mt-0.5 w-8 h-8 rounded-full bg-burnt-orange/15 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-4 h-4 text-burnt-orange" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-foreground leading-relaxed", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-burnt-orange", children: "Nduna can read your documents." }),
          " ",
          "Upload a contract, invoice, or registration — then tap",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: '"Ask Nduna to read"' }),
          " ",
          "and he'll understand the full content to help you with negotiations, claims, and planning."
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: onDismiss,
            className: "shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
            "aria-label": "Dismiss banner",
            "data-ocid": "document_vault.nduna_banner_dismiss",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
          }
        )
      ]
    }
  );
}
function DocumentVaultPage({
  tier = 1,
  isAdmin = false,
  onAskNduna
}) {
  const effectiveTier = isAdmin ? 3 : tier;
  const { documents, isLoading } = useDocuments();
  const [bannerDismissed, setBannerDismissed] = reactExports.useState(() => {
    try {
      return localStorage.getItem(NDUNA_BANNER_KEY) === "true";
    } catch {
      return false;
    }
  });
  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem(NDUNA_BANNER_KEY, "true");
    } catch {
    }
  };
  if (effectiveTier < 2) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(UpgradePrompt, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6",
      "data-ocid": "document_vault.page",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: "https://i.imgur.com/u98U7S6.png",
              alt: "Nduna",
              className: "w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-primary/30 mt-1"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-bold text-foreground", children: "My Documents" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-primary/15 text-primary border-primary/30 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-3 h-3 mr-1" }),
                "Secure Vault"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-0.5 leading-relaxed", children: "Keep your important papers safe — Nduna can access these anytime" })
          ] })
        ] }),
        !bannerDismissed && /* @__PURE__ */ jsxRuntimeExports.jsx(NdunaBanner, { onDismiss: handleDismissBanner }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Card,
          {
            className: "bg-card border-border shadow-card rounded-2xl overflow-hidden",
            "data-ocid": "document_vault.upload_section",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-4 border-b border-border/60 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-4 h-4 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-sm text-foreground uppercase tracking-wide", children: "Upload Document" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DocumentUpload, {}) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "document_vault.documents_section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-lg text-foreground", children: "Your Documents" }),
            documents.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-muted/60 text-muted-foreground border-border text-xs", children: documents.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            DocumentList,
            {
              docs: documents,
              isLoading,
              onAskNduna,
              onUploadClick: () => {
                var _a;
                (_a = document.querySelector(
                  "[data-ocid='document_upload.browse_button']"
                )) == null ? void 0 : _a.click();
              }
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 px-4 py-3 bg-primary/5 border border-primary/15 rounded-xl text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: "https://i.imgur.com/u98U7S6.png",
              alt: "Nduna",
              className: "w-6 h-6 rounded-full object-cover shrink-0"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: "Nduna" }),
            " can reference your documents in chat when you need help with renewals, tax queries, or compliance."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-muted/20 border-border/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-start gap-3 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-4 h-4 text-primary shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Documents are stored with end-to-end encryption on the Internet Computer blockchain. Only you can access them using your Internet Identity." })
        ] }) })
      ]
    }
  );
}
export {
  DocumentVaultPage as default
};
