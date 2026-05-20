import { useEffect, useRef } from "react";

interface Flake {
  x: number; y: number;
  r: number; speed: number;
  drift: number; phase: number; opacity: number;
}

export function SnowEffect() {
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

    const flakes: Flake[] = Array.from({ length: 200 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 3.5 + 0.8,
      speed: Math.random() * 1.4 + 0.3,
      drift: Math.random() * 0.9 - 0.45,
      phase: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.55 + 0.25,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tick += 0.008;

      for (const f of flakes) {
        ctx.globalAlpha = f.opacity;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();

        f.y += f.speed;
        f.x += Math.sin(tick + f.phase) * f.drift;

        if (f.y > canvas.height + f.r) {
          f.y = -f.r;
          f.x = Math.random() * canvas.width;
        }
        if (f.x < -f.r) f.x = canvas.width + f.r;
        if (f.x > canvas.width + f.r) f.x = -f.r;
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
      style={{
        position: "fixed", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
}
