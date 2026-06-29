import { useEffect, useRef } from "react";

interface Meteor {
  x: number; y: number;
  dx: number; dy: number;
  len: number; speed: number;
  opacity: number;
  active: boolean;
  cooldown: number;
}

export function MeteorShowerEffect() {
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

    const spawnMeteor = (m: Meteor) => {
      m.x = Math.random() * canvas.width * 0.75 + canvas.width * 0.1;
      m.y = Math.random() * canvas.height * 0.3;
      m.len = Math.random() * 130 + 70;
      m.speed = Math.random() * 8 + 7;
      m.opacity = 0.95;
      m.active = true;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.25;
      m.dx = Math.cos(angle) * m.speed;
      m.dy = Math.sin(angle) * m.speed;
    };

    const meteors: Meteor[] = Array.from({ length: 10 }, (_, i) => {
      const m: Meteor = { x: 0, y: 0, dx: 0, dy: 0, len: 100, speed: 10, opacity: 0, active: false, cooldown: i * 40 + Math.random() * 120 };
      return m;
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const m of meteors) {
        if (!m.active) {
          m.cooldown--;
          if (m.cooldown <= 0) spawnMeteor(m);
          continue;
        }

        // Tail — from back to head
        const tailX = m.x - (m.dx / m.speed) * m.len;
        const tailY = m.y - (m.dy / m.speed) * m.len;

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0,    "rgba(255,255,255,0)");
        grad.addColorStop(0.65, `rgba(253,235,195,${m.opacity * 0.35})`);
        grad.addColorStop(1,    `rgba(255,255,255,${m.opacity})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        // Glowing head
        const headGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 5);
        headGrad.addColorStop(0, `rgba(255,255,255,${m.opacity})`);
        headGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 5, 0, Math.PI * 2);
        ctx.fill();

        m.x += m.dx;
        m.y += m.dy;
        m.opacity -= 0.007;

        if (m.opacity <= 0 || m.x > canvas.width + 150 || m.y > canvas.height + 150) {
          m.active = false;
          m.opacity = 0;
          m.cooldown = Math.random() * 220 + 80;
        }
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
