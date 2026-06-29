import { useEffect, useRef } from "react";

const LEAF_COLORS = ["#fb923c", "#f97316", "#ef4444", "#facc15", "#f59e0b", "#dc2626", "#b45309", "#d97706"];

interface Leaf {
  x: number; y: number;
  w: number; h: number;
  speed: number;
  drift: number; phase: number;
  rotation: number; rotSpeed: number;
  color: string;
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  rotation: number, color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const hw = w / 2, hh = h / 2;

  // Main leaf shape — pointed tips, curved sides
  ctx.beginPath();
  ctx.moveTo(0, -hh);
  ctx.bezierCurveTo(hw * 0.9, -hh * 0.5, hw, hh * 0.3, 0, hh);
  ctx.bezierCurveTo(-hw, hh * 0.3, -hw * 0.9, -hh * 0.5, 0, -hh);
  ctx.closePath();

  ctx.globalAlpha = 0.88;
  ctx.fillStyle = color;
  ctx.fill();

  // Midrib vein
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 0.9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -hh * 0.88);
  ctx.quadraticCurveTo(hw * 0.04, 0, 0, hh * 0.88);
  ctx.stroke();

  // Side veins — 3 pairs
  ctx.lineWidth = 0.5;
  const pairs: [number, number, number][] = [
    [-hh * 0.5, hw * 0.58, -hh * 0.12],
    [-hh * 0.08, hw * 0.72, hh * 0.28],
    [hh * 0.28, hw * 0.55, hh * 0.58],
  ];
  for (const [sy, vx, ey] of pairs) {
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.quadraticCurveTo(vx * 0.45, (sy + ey) / 2, vx, ey);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.quadraticCurveTo(-vx * 0.45, (sy + ey) / 2, -vx, ey);
    ctx.stroke();
  }

  ctx.restore();
}

export function AutumnLeavesEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let tick = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const leaves: Leaf[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      w: Math.random() * 14 + 9,
      h: Math.random() * 22 + 15,
      speed: Math.random() * 1.1 + 0.45,
      drift: Math.random() * 1.1 - 0.55,
      phase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      tick += 0.01;

      for (const l of leaves) {
        drawLeaf(ctx, l.x, l.y, l.w, l.h, l.rotation, l.color);

        l.y += l.speed;
        l.x += Math.sin(tick + l.phase) * l.drift;
        l.rotation += l.rotSpeed;

        if (l.y > canvas.height + l.h) { l.y = -l.h; l.x = Math.random() * canvas.width; }
        if (l.x < -l.w) l.x = canvas.width + l.w;
        if (l.x > canvas.width + l.w) l.x = -l.w;
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}
    />
  );
}
