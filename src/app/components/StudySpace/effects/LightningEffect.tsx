import { useEffect, useRef } from "react";

function drawBolt(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  depth: number
) {
  if (depth <= 0) return;

  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * 80;
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 30;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(mx, my);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (depth > 1 && Math.random() < 0.4) {
    const bx = mx + (Math.random() - 0.5) * 200;
    const by = my + Math.random() * 150 + 50;
    ctx.lineWidth = Math.max(0.3, ctx.lineWidth * 0.6);
    drawBolt(ctx, mx, my, bx, by, depth - 1);
  }

  drawBolt(ctx, x1, y1, mx, my, depth - 1);
  drawBolt(ctx, mx, my, x2, y2, depth - 1);
}

export function LightningEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let flashOpacity = 0;
    let nextStrike = Date.now() + (Math.random() * 4000 + 3000);
    let boltActive = false;
    let boltTimer = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();

      if (now >= nextStrike && !boltActive) {
        boltActive = true;
        boltTimer = now;
        flashOpacity = 0.18;
        nextStrike = now + Math.random() * 6000 + 5000;
      }

      if (boltActive) {
        const elapsed = now - boltTimer;
        flashOpacity = Math.max(0, 0.18 - elapsed / 200 * 0.18);

        if (flashOpacity > 0) {
          ctx.fillStyle = `rgba(230,220,255,${flashOpacity})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (elapsed < 80) {
          const startX = Math.random() * canvas.width * 0.6 + canvas.width * 0.2;
          ctx.strokeStyle = "rgba(220,200,255,0.9)";
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#c4b5fd";
          ctx.lineCap = "round";
          drawBolt(ctx, startX, 0, startX + (Math.random() - 0.5) * 120, canvas.height * 0.7, 3);
          ctx.shadowBlur = 0;
        }

        if (elapsed > 250) boltActive = false;
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
      style={{
        position: "fixed", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
}
