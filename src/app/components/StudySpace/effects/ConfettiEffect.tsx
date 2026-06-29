import { useEffect, useRef } from "react";

const COLORS = [
  "#f87171", "#fb923c", "#fbbf24", "#4ade80",
  "#60a5fa", "#a78bfa", "#f472b6", "#34d399",
  "#e879f9", "#38bdf8", "#fde68a",
];

interface Piece {
  x: number; y: number;
  w: number; h: number;
  color: string;
  speed: number; drift: number; phase: number;
  rotation: number; rotSpeed: number;
  shape: 0 | 1; // 0 = rect, 1 = circle
}

export function ConfettiEffect() {
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

    const pieces: Piece[] = Array.from({ length: 110 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      w: Math.random() * 9 + 4,
      h: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: Math.random() * 1.8 + 0.6,
      drift: Math.random() * 1.8 - 0.9,
      phase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.1,
      shape: (Math.random() < 0.28 ? 1 : 0) as 0 | 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tick += 0.01;

      for (const p of pieces) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = 0.84;
        ctx.fillStyle = p.color;

        if (p.shape === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }

        ctx.restore();

        p.y += p.speed;
        p.x += Math.sin(tick + p.phase) * p.drift;
        p.rotation += p.rotSpeed;

        if (p.y > canvas.height + p.h) { p.y = -p.h; p.x = Math.random() * canvas.width; }
        if (p.x < -p.w) p.x = canvas.width + p.w;
        if (p.x > canvas.width + p.w) p.x = -p.w;
      }

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
