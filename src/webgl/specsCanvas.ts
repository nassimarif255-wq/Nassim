// Interactive Isometric Architectural Slab & Ceramic Grid Wireframe Canvas
export function initSpecsCanvas(canvas: HTMLCanvasElement | null): () => void {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  let angle = 0.45;
  const targetSpeed = 0.005;
  let hoverBoost = 0;
  let rafId = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };

  const onEnter = () => {
    hoverBoost = 0.012;
  };
  const onLeave = () => {
    hoverBoost = 0;
  };

  const parent = canvas.parentElement;
  parent?.addEventListener('pointerenter', onEnter);
  parent?.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const project = (
    x: number,
    y: number,
    z: number,
    rotY: number,
    cx: number,
    cy: number,
    scale: number
  ) => {
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const rx = x * cosY - z * sinY;
    const rz = x * sinY + z * cosY;
    const tilt = 0.42;
    const px = cx + rx * scale;
    const py = cy + (rz * Math.sin(tilt) - y * Math.cos(tilt)) * scale;
    return [px, py] as const;
  };

  const draw = () => {
    resize();
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isDark =
      document.documentElement.getAttribute('data-theme') !== 'light';
    const strokeMain = isDark
      ? 'rgba(245, 244, 240, 0.22)'
      : 'rgba(18, 21, 19, 0.18)';
    const strokeAccent = isDark
      ? 'rgba(116, 166, 134, 0.85)'
      : 'rgba(47, 74, 59, 0.78)';

    const cx = w * 0.5;
    const cy = h * 0.42;
    const scale = Math.min(w, h) * 0.34;

    if (!prefersReduced) {
      angle += targetSpeed + hoverBoost;
    }

    ctx.lineWidth = Math.max(1.2, w / 460);

    // Draw architectural porcelain tile grid floor plane (y = -0.35)
    const gridN = 4;
    for (let i = -gridN; i <= gridN; i++) {
      const t = i / gridN;
      ctx.beginPath();
      ctx.strokeStyle = i === 0 ? strokeAccent : strokeMain;
      const [x1, y1] = project(t, -0.35, -1, angle, cx, cy, scale);
      const [x2, y2] = project(t, -0.35, 1, angle, cx, cy, scale);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.beginPath();
      const [z1x, z1y] = project(-1, -0.35, t, angle, cx, cy, scale);
      const [z2x, z2y] = project(1, -0.35, t, angle, cx, cy, scale);
      ctx.moveTo(z1x, z1y);
      ctx.lineTo(z2x, z2y);
      ctx.stroke();
    }

    // Draw elevated architectural structural volume
    const boxW = 0.62;
    const boxH = 0.72;
    const corners: [number, number, number][] = [
      [-boxW, -0.35, -boxW],
      [boxW, -0.35, -boxW],
      [boxW, -0.35, boxW],
      [-boxW, -0.35, boxW],
      [-boxW, -0.35 + boxH, -boxW],
      [boxW, -0.35 + boxH, -boxW],
      [boxW, -0.35 + boxH, boxW],
      [-boxW, -0.35 + boxH, boxW],
    ];

    const edges: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];

    const projected = corners.map(([x, y, z]) =>
      project(x, y, z, angle, cx, cy, scale)
    );

    ctx.strokeStyle = strokeAccent;
    ctx.lineWidth = Math.max(1.5, w / 360);
    for (const [a, b] of edges) {
      ctx.beginPath();
      ctx.moveTo(projected[a][0], projected[a][1]);
      ctx.lineTo(projected[b][0], projected[b][1]);
      ctx.stroke();
    }

    if (!prefersReduced) {
      rafId = requestAnimationFrame(draw);
    }
  };

  rafId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(rafId);
    parent?.removeEventListener('pointerenter', onEnter);
    parent?.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', resize);
  };
}
