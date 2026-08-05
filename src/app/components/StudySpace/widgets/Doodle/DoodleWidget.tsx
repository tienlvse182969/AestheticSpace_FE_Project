import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DoodleStroke } from "../../../../hooks/studyspace/useDoodleSettings";

const CANVAS_W = 220;
const CANVAS_H = 150;
const MAX_STROKES = 150;
const MAX_TOTAL_POINTS = 6000;
const MIN_POINT_DIST = 3;

const BRUSH_COLORS = ["#f472b6", "#fbbf24", "#4ade80", "#60a5fa", "#a78bfa", "#f8fafc"];

interface DoodleWidgetProps {
  strokes: DoodleStroke[];
  brushColor: string;
  brushWidth: number;
  onAddStroke: (stroke: DoodleStroke) => void;
  onClearAll: () => void;
  onBrushColor: (c: string) => void;
  onBrushWidth: (w: number) => void;
}

function totalPoints(strokes: DoodleStroke[]) {
  return strokes.reduce((sum, s) => sum + s.points.length / 2, 0);
}

export function DoodleWidget({ strokes, brushColor, brushWidth, onAddStroke, onClearAll, onBrushColor, onBrushWidth }: DoodleWidgetProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef<DoodleStroke | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const capReached = strokes.length >= MAX_STROKES || totalPoints(strokes) >= MAX_TOTAL_POINTS;

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) drawStroke(ctx, stroke);
    if (drawingRef.current) drawStroke(ctx, drawingRef.current);
  };

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: DoodleStroke) {
    if (stroke.points.length < 2) return;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(stroke.points[0], stroke.points[1]);
    for (let i = 2; i < stroke.points.length; i += 2) ctx.lineTo(stroke.points[i], stroke.points[i + 1]);
    ctx.stroke();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;
    const ctx = canvas.getContext("2d");
    ctx?.scale(dpr, dpr);
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { redraw(); }, [strokes]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (capReached) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = getPoint(e);
    drawingRef.current = { color: brushColor, width: brushWidth, points: [x, y] };
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const [x, y] = getPoint(e);
    const pts = drawingRef.current.points;
    const lastX = pts[pts.length - 2], lastY = pts[pts.length - 1];
    const dist = Math.hypot(x - lastX, y - lastY);
    if (dist < MIN_POINT_DIST) return;
    pts.push(x, y);
    redraw();
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    const stroke = drawingRef.current;
    drawingRef.current = null;
    if (stroke.points.length >= 4) onAddStroke(stroke);
    redraw();
  };

  return (
    <div style={{
      width: CANVAS_W + 16,
      padding: "10px 8px 8px",
      borderRadius: 14,
      background: "rgba(12,18,22,0.72)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      border: "1px solid rgba(244,114,182,0.22)",
      boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
    }}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          touchAction: "none",
          cursor: "crosshair",
          display: "block",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {BRUSH_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onBrushColor(c)}
              onPointerDown={e => e.stopPropagation()}
              style={{
                width: 16, height: 16, borderRadius: "50%", background: c, cursor: "pointer",
                border: brushColor === c ? "2px solid white" : "1px solid rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="range" min={1} max={8} value={brushWidth}
            onChange={e => onBrushWidth(Number(e.target.value))}
            onPointerDown={e => e.stopPropagation()}
            style={{ width: 44 }}
          />
          <button
            onClick={() => { if (confirmClear) { onClearAll(); setConfirmClear(false); } else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 2500); } }}
            onPointerDown={e => e.stopPropagation()}
            title={t("doodle.clearCanvas")}
            style={{
              width: 22, height: 22, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
              background: confirmClear ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.07)",
              border: confirmClear ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
              color: confirmClear ? "#fca5a5" : "rgba(255,255,255,0.5)", cursor: "pointer",
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
      {capReached && (
        <div style={{ fontSize: "0.6rem", color: "rgba(248,113,113,0.75)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 4, textAlign: "center" }}>
          {t("doodle.canvasFull")}
        </div>
      )}
    </div>
  );
}
