import { useEffect, useRef } from "react";

interface Petal {
  x: number; y: number;
  w: number; h: number;
  speed: number; drift: number; phase: number;
  rotation: number; rotSpeed: number;
  opacity: number; hue: number;
}

function drawPetal(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  rotation: number,
  opacity: number,
  hue: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;

  const hw = w / 2, hh = h / 2;

  // Cherry blossom petal: pointed stem at bottom, notched (heart-like) at top
  ctx.beginPath();
  ctx.moveTo(0, hh);                                              // stem tip (bottom)
  ctx.bezierCurveTo(hw * 0.65, hh * 0.38, hw * 0.55, -hh * 0.14, hw * 0.22, -hh * 0.42);  // right flare up
  ctx.bezierCurveTo(hw * 0.10, -hh * 0.57, 0, -hh * 0.48, 0, -hh * 0.52);                  // right notch in
  ctx.bezierCurveTo(0, -hh * 0.48, -hw * 0.10, -hh * 0.57, -hw * 0.22, -hh * 0.42);         // left notch out
  ctx.bezierCurveTo(-hw * 0.55, -hh * 0.14, -hw * 0.65, hh * 0.38, 0, hh);                   // left flare down
  ctx.closePath();

  // Main fill — soft pink gradient from center out
  const grad = ctx.createRadialGradient(0, -hh * 0.1, 0, 0, 0, h * 0.6);
  grad.addColorStop(0, `hsl(${hue}, 85%, 90%)`);
  grad.addColorStop(1, `hsl(${hue}, 75%, 78%)`);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle center vein
  ctx.globalAlpha = opacity * 0.28;
  ctx.strokeStyle = `hsl(${hue - 10}, 60%, 62%)`;
  ctx.lineWidth = 0.55;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, hh * 0.72);
  ctx.quadraticCurveTo(hw * 0.04, 0, 0, -hh * 0.44);
  ctx.stroke();

  ctx.restore();
}

export function CherryBlossomEffect() {
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

    const petals: Petal[] = Array.from({ length: 75 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      w: Math.random() * 10 + 7,
      h: Math.random() * 15 + 11,
      speed: Math.random() * 0.75 + 0.25,
      drift: Math.random() * 1.4 - 0.7,
      phase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      opacity: Math.random() * 0.35 + 0.55,
      hue: Math.random() * 15 + 335, // 335–350: rose-pink
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      tick += 0.008;

      for (const p of petals) {
        drawPetal(ctx, p.x, p.y, p.w, p.h, p.rotation, p.opacity, p.hue);

        p.y += p.speed;
        p.x += Math.sin(tick * 0.75 + p.phase) * p.drift;
        p.rotation += p.rotSpeed;

        if (p.y > canvas.height + p.h) { p.y = -p.h; p.x = Math.random() * canvas.width; }
        if (p.x < -p.w) p.x = canvas.width + p.w;
        if (p.x > canvas.width + p.w) p.x = -p.w;
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
