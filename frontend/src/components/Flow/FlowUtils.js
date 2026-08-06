/* ==========================================================
   SKF P-VSM Flow Engine
   FlowUtils.js
 
   Same public contract as before (FLOW_STYLES, FLOW_ROUTES,
   computeConnectionPath) plus a few small additions needed by
   the Flow Playback Engine (Flow.jsx):
 
     - findEdgeId(fromId, toId)   -> backend-ready lookup
     - getEdgeById(id)            -> raw FLOW_ROUTES entry
     - getCardEl(id)              -> exported DOM lookup
 
   Routing is fully hand-crafted per connection id (no auto
   routing library), orthogonal with rounded 90° bends, and
   matches the reference screenshot:
 
     - Material trunk runs straight across the top row.
     - Channel / Bearing "T" branches fan out from one stem.
     - Scrap routes run their own dedicated rails so they never
       touch the material lines (long-left / long-middle /
       vertical / short-right, per the brief).
     - Return routes are offset from their sibling material
       branch so the two never overlap.
========================================================== */
 
import { FLOW_ROUTES } from "./FlowRoutes";
 
/* ==========================================================
   Flow Styles
========================================================== */
 
export const FLOW_STYLES = {
 
  material: {
    stroke: "#16A34A",
    strokeWidth: 1.8,
    markerColor: "#16A34A",
    glowClass: "flow-card-glow-material",
    particleClass: "flow-particle-material",
  },
 
  scrap: {
    stroke: "#a855f7",
    strokeWidth: 3,
    dashArray: "8 6",
    markerColor: "#a855f7",
    glowClass: "flow-card-glow-scrap",
    particleClass: "flow-particle-scrap"
  },
 
  return: {
    stroke: "#DC2626",
    strokeWidth: 1.8,
    markerColor: "#DC2626",
    glowClass: "flow-card-glow-return",
    particleClass: "flow-particle-return",
  },
 
};
 
export { FLOW_ROUTES };
 
/* ==========================================================
   Card / Rect Helpers
========================================================== */
 
export function getCardEl(id) {
  return document.querySelector(`[data-flow-id="${id}"]`);
}
 
function getCard(id) {
  return getCardEl(id);
}
 
function getRect(id, container) {
 
  const element = getCard(id);
 
  if (!element) return null;
 
  const rect = element.getBoundingClientRect();
  const parent = container.getBoundingClientRect();
 
  return {
    left: rect.left - parent.left,
    top: rect.top - parent.top,
    right: rect.right - parent.left,
    bottom: rect.bottom - parent.top,
    width: rect.width,
    height: rect.height,
  };
 
}
 
/* ==========================================================
   Anchor Helpers
========================================================== */
 
function top(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top
  };
}

function bottom(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.bottom
  };
}
 
function left(rect) {
  return { x: rect.left, y: rect.top + rect.height / 2 };
}
 
function right(rect) {
  return { x: rect.right, y: rect.top + rect.height / 2 };
}
 
/* ==========================================================
   SVG Path Builder — orthogonal segments with smooth,
   rounded 90° bends (quadratic corner rounding).
========================================================== */
 
function buildRoundedPath(points, radius = 10) {
 
  if (points.length < 2) return "";
 
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
 
  let d = `M ${points[0].x} ${points[0].y} `;
 
  for (let i = 1; i < points.length - 1; i++) {
 
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
 
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
 
    const len1 = Math.hypot(v1.x, v1.y) || 1;
    const len2 = Math.hypot(v2.x, v2.y) || 1;
 
    const r = Math.min(radius, len1 / 2, len2 / 2);
 
    const p1 = {
      x: curr.x - (v1.x / len1) * r,
      y: curr.y - (v1.y / len1) * r,
    };
 
    const p2 = {
      x: curr.x + (v2.x / len2) * r,
      y: curr.y + (v2.y / len2) * r,
    };
 
    d += `L ${p1.x} ${p1.y} Q ${curr.x} ${curr.y} ${p2.x} ${p2.y} `;
 
  }
 
  const last = points[points.length - 1];
  d += `L ${last.x} ${last.y}`;
 
  return d;
 
}
 
/* ==========================================================
   Straight Route (top-row trunk)
========================================================== */
 
function drawStraight(fromRect, toRect) {

  const start = {
    x: fromRect.right - 20,
    y: fromRect.top + fromRect.height / 2
  };

  const end = {
    x: toRect.left + 2,
    y: toRect.top + toRect.height / 2
  };

  return buildRoundedPath([
    start,
    end
  ]);
}

function drawAccurateToPacking(fromRect, toRect) {

  const start = {
    x: fromRect.right,
    y: fromRect.top + fromRect.height / 2
  };

  const end = {
    x: toRect.left,
    y: toRect.top + toRect.height / 2
  };

  return buildRoundedPath([
    start,
    end
  ]);
}
 
/* ==========================================================
   Vertical Route (Accurate/Packing -> FPS)
========================================================== */
 
function drawAccurateToFps(fromRect, toRect) {

  const start = {
    x: fromRect.left + fromRect.width * 0.40,
    y: fromRect.bottom,
  };

  const end = {
    x: toRect.left + toRect.width * 0.45,
    y: toRect.top,
  };

  return buildRoundedPath([
    start,
    end,
  ]);
}

function drawPackingToFps(fromRect, toRect) {

  const start = {
    x: fromRect.left + fromRect.width * 0.60,
    y: fromRect.bottom,
  };

  const end = {
    x: toRect.left + toRect.width * 0.55,
    y: toRect.top,
  };

  return buildRoundedPath([
    start,
    end,
  ]);
}
function drawBearingToAccurate(fromRect, toRect) {

  const start = bottom(fromRect);

  const end = {
    x: toRect.left + toRect.width * 0.50,
    y: toRect.top
  };

  const railY = start.y + 50;

  return buildRoundedPath([
    start,
    { x: start.x, y: railY },
    { x: end.x, y: railY },
    end
  ]);
}

function drawBearingToPacking(fromRect, toRect) {

  const start = bottom(fromRect);

  const end = {
    x: toRect.left + toRect.width * 0.50,
    y: toRect.top
  };

  const railY = start.y + 50;

  return buildRoundedPath([
    start,
    { x: start.x, y: railY },
    { x: end.x, y: railY },
    end
  ]);
}
 
/* ==========================================================
   Branch Route — one stem fanning down into a child card.
   Used for Channel -> CPS/Disassembly/Rework and
   Bearing Storage -> Accurate/Auto Packing.
========================================================== */
 
function drawChannelToCps(fromRect, toRect) {

  const start = {
    x: fromRect.left + fromRect.width * 0.38, // left side of Channel
    y: fromRect.bottom
  };

  const end = {
    x: toRect.left + toRect.width * 0.58, // right side of CPS
    y: toRect.top
  };

  const midY = start.y + 50;

  return buildRoundedPath([
    start,
    { x: start.x, y: midY },
    { x: end.x, y: midY },
    end,
  ]);
}
 
function drawCpsToChannel(fromRect, toRect) {

  const start = {
    x: fromRect.left + fromRect.width * 0.50, // left side of CPS
    y: fromRect.top
  };

  const end = {
    x: toRect.left + toRect.width * 0.32, // right side of Channel
    y: toRect.bottom
  };

  const midY = start.y - 50;

  return buildRoundedPath([
    start,
    { x: start.x, y: midY },
    { x: end.x, y: midY },
    end,
  ]);
}

function drawChannelToDisassembly(fromRect, toRect) {

  const start = {
    x: fromRect.left + fromRect.width * 0.45,   // moved left
    y: fromRect.bottom
  };

  const end = {
    x: toRect.left + toRect.width * 0.45,       // moved left
    y: toRect.top
  };

  const midY = start.y + 50;

  return buildRoundedPath([
    start,
    { x: start.x, y: midY },
    { x: end.x, y: midY },
    end,
  ]);
}

function drawDisassemblyToChannel(fromRect, toRect) {

  const start = {
    x: fromRect.left + fromRect.width * 0.50,
    y: fromRect.top
  };

  const end = {
    x: toRect.left + toRect.width * 0.50,
    y: toRect.bottom
  };

  const midY = start.y - 40;

  return buildRoundedPath([
    start,
    { x: start.x, y: midY },
    { x: end.x, y: midY },
    end,
  ]);
}

function drawChannelToRework(fromRect, toRect) {

  const start = {
    x: fromRect.left + fromRect.width * 0.69,
    y: fromRect.bottom
  };

  const end = {
    x: toRect.left + toRect.width * 0.42,
    y: toRect.top
  };

  const midY = start.y + 50;

  return buildRoundedPath([
    start,
    { x: start.x, y: midY },
    { x: end.x, y: midY },
    end,
  ]);
}

function drawReworkToChannel(fromRect, toRect) {

  const start = {
    x: fromRect.left + toRect.width * 0.50,
    y: fromRect.top
  };

  const end = {
    x: toRect.left + toRect.width * 0.75,
    y: toRect.bottom
  };

  const midY = start.y - 50;

  return buildRoundedPath([
    start,
    { x: start.x, y: midY },
    { x: end.x, y: midY },
    end,
  ]);
}

/* ==========================================================
   Scrap Routes — each one rides its own dedicated rail so
   none of the four scrap lines ever cross a material line.
========================================================== */
 
// SHO -> Common Scrap  ("long left route")
function drawScrapLeft(fromRect, toRect) {

  const start = {
    x: fromRect.left + fromRect.width * 0.40, // move left
    y: fromRect.bottom,
  };
  const end = {
    x: toRect.left,
    y: toRect.top + toRect.height * 0.60,
  };

  const railY = end.y;

  return buildRoundedPath([
    start,

    { x: start.x, y: railY },

    end,
  ]);
}
 
// Channel -> Common Scrap  ("long middle route")
function drawScrapMiddle(fromRect, toRect) {

  const start = {
    x: fromRect.left + fromRect.width * 0.20,
    y: fromRect.bottom
  };

  const entry = {
    x: toRect.left,
    y: toRect.top + toRect.height * 0.20
  };

  // between SHO scrap rail and CPS card
  const railX = start.x - 400;

  // same height as entry
  const railY = entry.y;

  return `
    M ${start.x} ${start.y}
    L ${start.x} ${start.y + 30}
    L ${railX} ${start.y + 30}
    L ${railX} ${railY}
    L ${entry.x} ${railY}
  `;
}
 
// Disassembly -> Common Scrap  ("vertical route")
function drawScrapVertical(fromRect, toRect) {

  const start = bottom(fromRect);

  const end = {
    x: start.x,
    y: top(toRect).y
  };

  return buildRoundedPath([
    start,
    end,
  ]);
}
 
// Rework -> Common Scrap  ("right route")
function drawScrapShortRight(fromRect, toRect) {

  const start = bottom(fromRect);
  const end = right(toRect);

  return buildRoundedPath([
    start,

    { x: start.x, y: end.y },

    end,
  ]);
}

/* ==========================================================
   Route Registry — one hand-crafted drawer per connection id.
   Nothing here is auto-routed.
========================================================== */
const ROUTE_REGISTRY = {
 
  /* ================= Material ================= */
 
  "dm-sho": drawStraight,
  "sho-transit": drawStraight,
  "transit-channel": drawStraight,
  "channel-bearing": drawStraight,

  "channel-cps": drawChannelToCps,
  "channel-cps-return": drawCpsToChannel,
  "channel-disassembly": drawChannelToDisassembly,
  "channel-disassembly-return": drawDisassemblyToChannel,
  "channel-rework": drawChannelToRework,
  "channel-rework-return": drawReworkToChannel,
 

  "accurate-packing": drawAccurateToPacking,
  
  "bearing-accurate": drawBearingToAccurate,
  "bearing-packing": drawBearingToPacking,
 
  "accurate-fps": drawAccurateToFps,
  "packing-fps": drawPackingToFps,
 
  /* ================= Scrap ================= */
  "sho-scrap": drawScrapLeft,
  "channel-scrap": drawScrapMiddle,
  "disassembly-scrap": drawScrapVertical,
  "rework-scrap": drawScrapShortRight,
};
 
/* ==========================================================
   Style Helper
========================================================== */
 
function getStyle(type) {
  return FLOW_STYLES[type] || FLOW_STYLES.material;
}
 
/* ==========================================================
   Compute Connection Path
========================================================== */
 
export function computeConnectionPath(connection, container) {
 
  const fromRect = getRect(connection.from, container);
  const toRect = getRect(connection.to, container);
 
  if (!fromRect || !toRect) return null;
 
  const draw = ROUTE_REGISTRY[connection.id];
 
  if (!draw) return null;
 
  return {
    d: draw(fromRect, toRect),
    style: getStyle(connection.type),
  };
 
}
 
/* ==========================================================
   Backend-ready lookups
 
   Later, the backend can send:
     { "mo": "MO1001", "currentStep": "Channel", "nextStep": "Bearing Storage" }
 
   The frontend maps step names -> node ids (see NODE_ID_ALIASES),
   resolves the edge id with findEdgeId(), and hands it to the
   Flow Playback Engine, which already knows how to draw and
   animate that exact edge.
========================================================== */
 
export function getEdgeById(id) {
  return FLOW_ROUTES.find((edge) => edge.id === id) || null;
}
 
export function findEdgeId(fromId, toId) {
  const match = FLOW_ROUTES.find(
    (edge) => edge.from === fromId && edge.to === toId
  );
  return match ? match.id : null;
}
 
// Human-readable step name -> data-flow-id, for convenience
// when wiring a real backend payload (step names rarely match
// the kebab-case node ids 1:1).

export const NODE_ID_ALIASES = {
  "DM Store": "dm-store",
  "SHO": "sho",
  "Transit Buffer": "transit-buffer",
  "Channel": "channel",
  "Bearing Storage": "bearing-storage",
  "CPS": "cps",
  "Disassembly Area": "disassembly",
  "Rework Area": "rework",
  "Accurate": "accurate",
  "Auto Packing": "auto-packing",
  "FPS": "fps",
  "Common Scrap": "common-scrap",
};
 
export function resolveNodeId(stepName) {
  return NODE_ID_ALIASES[stepName] || stepName;
}