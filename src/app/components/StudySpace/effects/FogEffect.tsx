import { useEffect, useRef } from "react";

interface FogBlob {
  x: number; y: number;
  w: number; h: number;
  speed: number; opacity: number;
}

export function FogEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const blobs: FogBlob[] = Array.from({ length: 10 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      w: Math.random() * 500 + 300,
      h: Math.random() * 200 + 100,
      speed: Math.random() * 0.18 + 0.06,
      opacity: Math.random() * 0.07 + 0.04,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "blur(38px)";

      for (const b of blobs) {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.w / 2);
        grad.addColorStop(0, `rgba(200,215,230,${b.opacity})`);
        grad.addColorStop(1, "rgba(200,215,230,0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        b.x += b.speed;
        if (b.x - b.w / 2 > canvas.width) b.x = -b.w / 2;
      }

      ctx.filter = "none";
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
