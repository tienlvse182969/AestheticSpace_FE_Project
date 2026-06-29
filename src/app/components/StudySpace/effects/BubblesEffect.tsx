import { useEffect, useRef } from "react";

interface Bubble {
  x: number; y: number;
  r: number; speed: number;
  drift: number; driftFreq: number; phase: number;
  opacity: number;
  hueOffset: number; // seed cho iridescent color
}

// Vẽ một bong bóng xà phòng 3D với đầy đủ hiệu ứng quang học:
//   1. Iridescent thin-film color  — cầu vồng đổi màu theo thời gian
//   2. Rim glow                    — viền sáng (ánh sáng khúc xạ tại mép)
//   3. Bottom shadow               — bóng tối phía dưới (độ cầu 3D)
//   4. Diffuse highlight           — vùng sáng khuếch tán phía trên trái
//   5. Specular point              — điểm sáng nhỏ sắc nét (phản xạ nguồn sáng)
//   6. Thin stroke outline         — viền mỏng ngoài cùng
function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  opacity: number, hueOffset: number, tick: number
) {
  ctx.save();

  // Clip toàn bộ draw calls trong phạm vi hình tròn
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  const R2 = r * 2;
  const ox = x - r, oy = y - r; // top-left của bounding box

  // ── 1. Iridescent thin-film color ────────────────────────────────
  // Màu cầu vồng đổi chậm — mô phỏng thin-film interference của màng xà phòng
  const h1 = (hueOffset + tick * 12) % 360;
  const h2 = (h1 + 80)  % 360;
  const h3 = (h1 + 170) % 360;
  const iri = ctx.createLinearGradient(ox, oy, x + r, y + r);
  iri.addColorStop(0,    `hsla(${h1},90%,74%,${opacity * 0.22})`);
  iri.addColorStop(0.33, `hsla(${h2},85%,76%,${opacity * 0.16})`);
  iri.addColorStop(0.66, `hsla(${h3},88%,72%,${opacity * 0.20})`);
  iri.addColorStop(1,    `hsla(${h1},90%,70%,${opacity * 0.14})`);
  ctx.fillStyle = iri;
  ctx.fillRect(ox, oy, R2, R2);

  // ── 2. Rim glow — viền sáng do khúc xạ tại mép bong bóng ────────
  const rim = ctx.createRadialGradient(x, y, r * 0.76, x, y, r);
  rim.addColorStop(0,    "rgba(255,255,255,0)");
  rim.addColorStop(0.50, `rgba(210,235,255,${opacity * 0.28})`);
  rim.addColorStop(0.82, `rgba(255,255,255,${opacity * 0.52})`);
  rim.addColorStop(1,    `rgba(255,255,255,${opacity * 0.70})`);
  ctx.fillStyle = rim;
  ctx.fillRect(ox, oy, R2, R2);

  // ── 3. Bottom shadow — bóng bên trong để tạo độ cầu ─────────────
  const shadow = ctx.createRadialGradient(
    x + r * 0.10, y + r * 0.52, 0,
    x + r * 0.10, y + r * 0.52, r * 0.72
  );
  shadow.addColorStop(0,    `rgba(0,15,50,${opacity * 0.18})`);
  shadow.addColorStop(0.55, `rgba(0,15,50,${opacity * 0.08})`);
  shadow.addColorStop(1,    "rgba(0,15,50,0)");
  ctx.fillStyle = shadow;
  ctx.fillRect(ox, oy, R2, R2);

  // ── 4. Diffuse highlight — vùng sáng khuếch tán (trên-trái) ─────
  const diffHL = ctx.createRadialGradient(
    x - r * 0.24, y - r * 0.30, 0,
    x - r * 0.24, y - r * 0.30, r * 0.62
  );
  diffHL.addColorStop(0,    `rgba(255,255,255,${opacity * 0.50})`);
  diffHL.addColorStop(0.42, `rgba(255,255,255,${opacity * 0.20})`);
  diffHL.addColorStop(1,    "rgba(255,255,255,0)");
  ctx.fillStyle = diffHL;
  ctx.fillRect(ox, oy, R2, R2);

  // ── 5. Specular point — điểm sáng nhỏ sắc nét ───────────────────
  const spec = ctx.createRadialGradient(
    x - r * 0.38, y - r * 0.42, 0,
    x - r * 0.38, y - r * 0.42, r * 0.16
  );
  spec.addColorStop(0,    `rgba(255,255,255,${opacity * 0.98})`);
  spec.addColorStop(0.45, `rgba(255,255,255,${opacity * 0.45})`);
  spec.addColorStop(1,    "rgba(255,255,255,0)");
  ctx.fillStyle = spec;
  ctx.fillRect(ox, oy, R2, R2);

  ctx.restore(); // kết thúc clip

  // ── 6. Outline stroke — ngoài clip để không bị cắt ───────────────
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,255,255,${opacity * 0.42})`;
  ctx.lineWidth = Math.max(0.8, r * 0.038);
  ctx.stroke();
}

export function BubblesEffect() {
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

    const bubbles: Bubble[] = Array.from({ length: 22 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 30 + 12,
      speed: Math.random() * 0.48 + 0.16,
      drift: Math.random() * 0.55 + 0.15,
      driftFreq: Math.random() * 0.38 + 0.14,
      phase: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.22 + 0.52,
      hueOffset: Math.random() * 360,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tick += 0.01;

      for (const b of bubbles) {
        drawBubble(ctx, b.x, b.y, b.r, b.opacity, b.hueOffset, tick);

        b.y -= b.speed;
        b.x += Math.sin(tick * b.driftFreq + b.phase) * b.drift;

        if (b.y + b.r < 0) {
          b.y = canvas.height + b.r;
          b.x = Math.random() * canvas.width;
        }
        if (b.x < -b.r * 2) b.x = canvas.width + b.r * 2;
        if (b.x > canvas.width + b.r * 2) b.x = -b.r * 2;
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
