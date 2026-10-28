/** Decorative motifs from the logo: the laurel wreath and the lagoon waves. */

export function LaurelRing({ className, leaves = 30 }: { className?: string; leaves?: number }) {
  const r = 46;
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {Array.from({ length: leaves }, (_, i) => {
        // Two branches like the logo: a gap at the top and the bottom.
        const t = i / leaves;
        const side = t < 0.5 ? 1 : -1;
        const local = (t % 0.5) / 0.5; // 0..1 along one branch
        const angle = -90 + side * (12 + local * 156);
        const rad = (angle * Math.PI) / 180;
        const x = 50 + r * Math.cos(rad);
        const y = 50 + r * Math.sin(rad);
        const tilt = angle + 90 + side * 35;
        return <ellipse key={i} cx={x} cy={y} rx="1.6" ry="3.6" transform={`rotate(${tilt} ${x} ${y})`} className="laurel__leaf" />;
      })}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = -90 + (i + 0.5) * 45;
        const rad = (angle * Math.PI) / 180;
        return <circle key={`d${i}`} cx={50 + 41 * Math.cos(rad)} cy={50 + 41 * Math.sin(rad)} r="0.9" className="laurel__dot" />;
      })}
    </svg>
  );
}

export function Waves({ className }: { className?: string }) {
  const wave = "M0 20 Q 50 6 100 20 T 200 20 T 300 20 T 400 20 V 40 H 0 Z";
  return (
    <div className={`waves ${className ?? ""}`} aria-hidden="true">
      <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="waves__back">
        <path d={wave} />
      </svg>
      <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="waves__front">
        <path d={wave} />
      </svg>
    </div>
  );
}
