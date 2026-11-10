// Decorative SVG motion graphics. Both are hidden from assistive technology and carry no data:
// the reticle marks the instrument of the hero observation, the field is a schematic of
// comoving points receding as the scale factor grows.

export function HeroReticle({label}: {label: string}) {
  const ticks = Array.from({length: 72}, (_, index) => index);
  return (
    <div className="reticle" aria-hidden="true">
      <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeLinecap="round">
        <g className="reticle-ticks">
          {ticks.map(index => (
            <line key={index} x1="100" y1={index % 6 === 0 ? 4 : 7} x2="100" y2="11" strokeWidth={index % 6 === 0 ? 1.4 : 0.7} transform={`rotate(${index * 5} 100 100)`} />
          ))}
        </g>
        <circle className="reticle-ring" cx="100" cy="100" r="72" strokeWidth="1" pathLength="1" />
        <circle className="reticle-ring reticle-ring-inner" cx="100" cy="100" r="34" strokeWidth="1" pathLength="1" strokeDasharray="0.02 0.03" />
        <g className="reticle-cross" strokeWidth="1">
          <path d="M100 18v38M100 144v38M18 100h38M144 100h38" pathLength="1" />
        </g>
        <g className="reticle-corners" strokeWidth="1.6">
          <path d="M70 58H58v12M130 58h12v12M70 142H58v-12M130 142h12v-12" />
        </g>
        <circle className="reticle-dot" cx="100" cy="100" r="1.8" fill="currentColor" stroke="none" />
      </svg>
      <span className="reticle-label">{label}</span>
    </div>
  );
}

// Deterministic point set (no randomness at render time, so server and client agree).
const POINTS = Array.from({length: 46}, (_, index) => {
  const angle = index * 2.399963; // golden angle
  const radius = 28 + 232 * Math.sqrt((index + 0.5) / 46);
  return {x: 400 + radius * Math.cos(angle) * 1.55, y: 200 + radius * Math.sin(angle) * 0.78, r: index % 7 === 0 ? 3.2 : index % 3 === 0 ? 2.2 : 1.5};
});

export function ExpansionField() {
  const layer = (name: string) => (
    <g className={`field-layer ${name}`}>
      {[60, 120, 180, 240].map(radius => <ellipse key={radius} cx="400" cy="200" rx={radius * 1.55} ry={radius * 0.78} strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
      {POINTS.map((point, index) => <circle key={index} cx={point.x.toFixed(1)} cy={point.y.toFixed(1)} r={point.r} fill="currentColor" stroke="none" />)}
    </g>
  );
  return (
    <svg className="expansion-field" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" aria-hidden="true">
      {layer('field-a')}
      {layer('field-b')}
    </svg>
  );
}
