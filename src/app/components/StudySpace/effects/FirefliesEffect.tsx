import { useEffect, useRef } from "react";

interface Firefly {
  x: number; y: number;
  vx: number; vy: number;
  phase: number; r: number;
}

export function FirefliesEffect() {
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

    const flies: Firefly[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
      r: Math.random() * 3 + 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tick += 0.015;

      for (const f of flies) {
        const glow = (Math.sin(tick * 1.4 + f.phase) + 1) / 2;
        const opacity = glow * 0.8 + 0.1;

        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 4);
        grad.addColorStop(0, `rgba(134,239,172,${opacity})`);
        grad.addColorStop(0.4, `rgba(74,222,128,${opacity * 0.5})`);
        grad.addColorStop(1, "rgba(74,222,128,0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = opacity;
        ctx.fillStyle = "#ecfdf5";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        f.x += f.vx + Math.sin(tick + f.phase) * 0.4;
        f.y += f.vy + Math.cos(tick * 0.7 + f.phase) * 0.25;

        if (f.x < -10) f.x = canvas.width + 10;
        if (f.x > canvas.width + 10) f.x = -10;
        if (f.y < -10) f.y = canvas.height + 10;
        if (f.y > canvas.height + 10) f.y = -10;
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
