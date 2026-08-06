import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import "./Flow.css";

import {
  FLOW_ROUTES,
  FLOW_STYLES,
  computeConnectionPath,
  getCardEl,
  getEdgeById,
  findEdgeId,
  resolveNodeId,
} from "./FlowUtils";

import { mockMO, MO_ROUTES } from "./FlowMockData";

/* ==========================================================
   Playback Engine
   ========================================================== */

function createPlaybackEngine({ pathRefs, lengthsRef, particleRef, tokenRef, recalculate }) {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function clearAllGlows() {
    FLOW_ROUTES.forEach((edge) => {
      const elFrom = getCardEl(edge.from);
      const elTo = getCardEl(edge.to);
      if (elFrom) Object.values(FLOW_STYLES).forEach((s) => elFrom.classList.remove(s.glowClass));
      if (elTo) Object.values(FLOW_STYLES).forEach((s) => elTo.classList.remove(s.glowClass));
    });
  }

  function glowCard(nodeId, style) {
    clearAllGlows();
    const el = getCardEl(nodeId);
    if (!el) return;
    el.classList.add(style.glowClass);
    window.clearTimeout(el.__flowGlowTimeout);
    el.__flowGlowTimeout = window.setTimeout(() => {
      el.classList.remove(style.glowClass);
    }, 1400);
  }

  function resetAll() {
    // Invalidate current token to kill all running frame animations instantly
    tokenRef.current++;
    clearAllGlows();

    Object.values(pathRefs.current).forEach((node) => {
      if (!node) return;
      node.style.strokeDasharray = "none";
      node.style.strokeDashoffset = "0";
      node.classList.remove("is-active", "is-revealed");
    });

    if (particleRef.current) {
      particleRef.current.classList.remove("is-visible");
      particleRef.current.setAttribute("cx", "0");
      particleRef.current.setAttribute("cy", "0");
    }
  }

  function animateSegment(edgeId, token) {
    return new Promise((resolve) => {
      const node = pathRefs.current[edgeId];
      const edge = getEdgeById(edgeId);

      if (!node || !edge || tokenRef.current !== token) {
        resolve();
        return;
      }

      const style = FLOW_STYLES[edge.type] || FLOW_STYLES.material;
      const length = lengthsRef.current[edgeId] || node.getTotalLength();
      const particle = particleRef.current;

      if (particle) {
        particle.setAttribute(
          "class",
          `flow-particle is-visible ${style.particleClass}`
        );
      }

      const duration = Math.min(2800, Math.max(1400, length * 2.5));
      const start = performance.now();

      function frame(now) {
        // Kill frame loop immediately if token changes (e.g. on tab change / reset)
        if (tokenRef.current !== token) {
          if (particle) particle.classList.remove("is-visible");
          resolve();
          return;
        }

        const progress = Math.min(1, (now - start) / duration);
        const point = node.getPointAtLength(length * progress);

        if (particle) {
          particle.setAttribute("cx", point.x);
          particle.setAttribute("cy", point.y);
        }

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          glowCard(edge.to, style);
          resolve();
        }
      }

      requestAnimationFrame(frame);
    });
  }

  async function playRoute(edgeIds, token) {
    for (const edgeId of edgeIds) {
      if (tokenRef.current !== token) return;
      await animateSegment(edgeId, token);
      await wait(90);
    }
  }

  async function playMO(mo, token) {
    const route = MO_ROUTES[mo.mo];
    if (!route || tokenRef.current !== token) return;
    glowCard("dm-store", FLOW_STYLES.material);
    await playRoute(route, token);
  }

  async function playAll() {
    // Incrementing token invalidates any existing background loops instantly
    const token = ++tokenRef.current;

    recalculate();
    clearAllGlows();
    if (particleRef.current) particleRef.current.classList.remove("is-visible");

    await wait(200);

    while (tokenRef.current === token) {
      for (const mo of mockMO) {
        if (tokenRef.current !== token) return;
        await playMO(mo, token);
        if (tokenRef.current !== token) return;
        await wait(300);
      }
      if (tokenRef.current !== token) return;
      await wait(800);
    }
  }

  function playSegment(fromStep, toStep) {
    const edgeId = findEdgeId(resolveNodeId(fromStep), resolveNodeId(toStep));
    if (!edgeId) return;
    const token = ++tokenRef.current;
    animateSegment(edgeId, token);
  }

  return { resetAll, playAll, playSegment };
}

/* ==========================================================
   Flow Component
   ========================================================== */

const Flow = forwardRef((props, ref) => {
  const svgRef = useRef(null);
  const pathRefs = useRef({});
  const lengthsRef = useRef({});
  const particleRef = useRef(null);
  const tokenRef = useRef(0);

  const [paths, setPaths] = useState([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  const recalculate = useCallback(() => {
    const container = document.querySelector(".pvsm-canvas");
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setSvgSize({ width: rect.width, height: rect.height });

    const result = FLOW_ROUTES.map((connection) => {
      const computed = computeConnectionPath(connection, container);
      if (!computed) return null;
      return {
        id: connection.id,
        from: connection.from,
        to: connection.to,
        type: connection.type,
        ...computed,
      };
    }).filter(Boolean);

    setPaths(result);
  }, []);

  const engine = useMemo(
    () => createPlaybackEngine({ pathRefs, lengthsRef, particleRef, tokenRef, recalculate }),
    [recalculate]
  );

  useImperativeHandle(ref, () => ({
    playAll: () => engine.playAll(),
    resetAll: () => engine.resetAll(),
    playSegment: (from, to) => engine.playSegment(from, to)
  }));

  useEffect(() => {
    window.addEventListener("resize", recalculate);

    const container = document.querySelector(".pvsm-canvas");
    let observer;

    if (container) {
      observer = new ResizeObserver(() => recalculate());
      observer.observe(container);
    }

    return () => {
      window.removeEventListener("resize", recalculate);
      observer?.disconnect();
    };
  }, [recalculate]);

  useEffect(() => {
    paths.forEach((path) => {
      const node = pathRefs.current[path.id];
      if (!node) return;

      const length = node.getTotalLength();
      lengthsRef.current[path.id] = length;

      if (path.type === "scrap") {
        node.style.strokeDasharray = "8 6";
        node.style.strokeDashoffset = "0";
      } else {
        node.style.strokeDasharray = "none";
        node.style.strokeDashoffset = "0";
      }
    });
  }, [paths]);

  useEffect(() => {
    // Delay startup briefly so the browser finishes tab switching/layout rendering
    const timer = setTimeout(() => {
      recalculate();
      engine.playAll();
    }, 150);

    window.SKF_FLOW = {
      playSegment: engine.playSegment,
      reset: engine.resetAll,
      playAll: engine.playAll
    };

    // Cleanup: Immediately stops old loops and clears states when switching away
    return () => {
      clearTimeout(timer);
      engine.resetAll();
      delete window.SKF_FLOW;
    };
  }, [engine, recalculate]);

  return (
    <svg
      ref={svgRef}
      className="flow-svg"
      width={svgSize.width}
      height={svgSize.height}
      viewBox={`0 0 ${svgSize.width || 1} ${svgSize.height || 1}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id="arrow-green"
          markerWidth="10"
          markerHeight="10"
          refX="10"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#16A34A" />
        </marker>

        <marker
          id="arrow-red"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#DC2626" />
        </marker>

        <marker
          id="arrow-purple"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#A855F7" />
        </marker>
      </defs>

      {paths.map((path) => (
        <path
          key={path.id}
          id={`flow-path-${path.id}`}
          ref={(el) => {
            if (el) pathRefs.current[path.id] = el;
          }}
          className="flow-path"
          d={path.d}
          stroke={path.style.stroke}
          strokeWidth={path.style.strokeWidth}
          markerEnd={
            path.type === "material"
              ? "url(#arrow-green)"
              : path.type === "return"
              ? "url(#arrow-red)"
              : "url(#arrow-purple)"
          }
          markerStart={
            path.type === "return"
              ? "url(#arrow-red)"
              : undefined
          }
        />
      ))}

      <circle
        ref={particleRef}
        className="flow-particle"
        r="8"
        cx="0"
        cy="0"
      />
    </svg>
  );
});

export default Flow;