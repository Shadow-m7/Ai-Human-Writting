import type { DiagramSpec, HandwritingFont, InkColor } from '../types/assignment';

interface HanddrawnDiagramProps {
  diagram: DiagramSpec;
  inkColor: InkColor;
  font: HandwritingFont;
}

const INK_HEX: Record<InkColor, { stroke: string; fill: string; muted: string }> = {
  'royal-blue': {
    stroke: '#1e3a8a',
    fill: 'rgba(219, 234, 254, 0.35)',
    muted: '#2563eb',
  },
  'blue-black': {
    stroke: '#1e293b',
    fill: 'rgba(226, 232, 240, 0.42)',
    muted: '#475569',
  },
  'carbon-black': {
    stroke: '#18181b',
    fill: 'rgba(244, 244, 245, 0.5)',
    muted: '#3f3f46',
  },
};

function getFontFamily(font: HandwritingFont): string {
  switch (font) {
    case 'caveat':
      return '"Caveat", "Kalam", cursive';
    case 'patrick':
      return '"Patrick Hand", "Kalam", cursive';
    case 'indie':
      return '"Indie Flower", "Kalam", cursive';
    default:
      return '"Kalam", cursive';
  }
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

export function HanddrawnDiagram({ diagram, inkColor, font }: HanddrawnDiagramProps) {
  const palette = INK_HEX[inkColor];
  const fontFamily = getFontFamily(font);
  const nodes = diagram.nodes.slice(0, 6);
  const count = nodes.length;

  if (count === 0) return null;

  const width = 620;
  const height = 192;

  // Compute node coordinates based on diagram type
  const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};

  if (diagram.type === 'cycle' && count >= 3) {
    const cx = width / 2;
    const cy = height / 2 + 4;
    const rx = 200;
    const ry = 60;
    nodes.forEach((node, idx) => {
      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / count;
      const w = 130;
      const h = 44;
      positions[node.id] = {
        x: cx + Math.cos(angle) * rx - w / 2,
        y: cy + Math.sin(angle) * ry - h / 2,
        w,
        h,
      };
    });
  } else if (diagram.type === 'hierarchy' && count >= 2) {
    const root = nodes[0];
    const children = nodes.slice(1);
    const rootW = 160;
    const rootH = 44;
    positions[root.id] = {
      x: width / 2 - rootW / 2,
      y: 14,
      w: rootW,
      h: rootH,
    };
    const childCount = children.length;
    const childW = Math.min(138, Math.floor((width - 40) / childCount) - 14);
    const totalW = childCount * childW + (childCount - 1) * 14;
    const startX = (width - totalW) / 2;
    children.forEach((child, idx) => {
      positions[child.id] = {
        x: startX + idx * (childW + 14),
        y: 118,
        w: childW,
        h: 50,
      };
    });
  } else if (diagram.type === 'comparison' && count >= 2) {
    const leftNodes = nodes.filter((_, i) => i % 2 === 0);
    const rightNodes = nodes.filter((_, i) => i % 2 === 1);
    const boxW = 240;
    const boxH = 44;
    leftNodes.forEach((n, idx) => {
      positions[n.id] = {
        x: 34,
        y: 22 + idx * 54,
        w: boxW,
        h: boxH,
      };
    });
    rightNodes.forEach((n, idx) => {
      positions[n.id] = {
        x: width - boxW - 34,
        y: 22 + idx * 54,
        w: boxW,
        h: boxH,
      };
    });
  } else {
    // Default flowchart: single row up to 3 nodes, or 2 rows for 4-6 nodes
    if (count <= 3) {
      const boxW = 152;
      const boxH = 54;
      const gap = 36;
      const totalW = count * boxW + (count - 1) * gap;
      const startX = (width - totalW) / 2;
      nodes.forEach((n, idx) => {
        positions[n.id] = {
          x: startX + idx * (boxW + gap),
          y: height / 2 - boxH / 2,
          w: boxW,
          h: boxH,
        };
      });
    } else {
      const topCount = Math.ceil(count / 2);
      const bottomCount = count - topCount;
      const boxW = 152;
      const boxH = 48;
      const gap = 36;

      const topTotal = topCount * boxW + (topCount - 1) * gap;
      const topStartX = (width - topTotal) / 2;
      for (let i = 0; i < topCount; i++) {
        positions[nodes[i].id] = {
          x: topStartX + i * (boxW + gap),
          y: 20,
          w: boxW,
          h: boxH,
        };
      }

      const botTotal = bottomCount * boxW + (bottomCount - 1) * gap;
      const botStartX = (width - botTotal) / 2;
      for (let i = 0; i < bottomCount; i++) {
        positions[nodes[topCount + i].id] = {
          x: botStartX + i * (boxW + gap),
          y: 118,
          w: boxW,
          h: boxH,
        };
      }
    }
  }

  // Fallback sequential edges if AI returned empty edges
  const edges =
    diagram.edges && diagram.edges.length > 0
      ? diagram.edges
      : nodes.slice(0, -1).map((n, i) => ({
          from: n.id,
          to: nodes[i + 1].id,
          label: '',
        }));

  const markerId = `ink-arrow-${inkColor}-${diagram.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

  return (
    <div
      className="my-2 px-2 py-1.5 rounded border"
      style={{
        borderColor: `${palette.stroke}40`,
        backgroundColor: 'rgba(255, 255, 255, 0.55)',
      }}
    >
      <div
        className="text-center font-semibold mb-1"
        style={{
          fontFamily,
          color: palette.stroke,
          fontSize: '13px',
          textDecoration: 'underline',
          textDecorationStyle: 'solid',
        }}
      >
        Fig: {diagram.title}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        role="img"
        aria-label={diagram.title}
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path
              d="M 1 1 L 7 4 L 1 7"
              fill="none"
              stroke={palette.stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        {diagram.type === 'comparison' && (
          <line
            x1={width / 2}
            y1={12}
            x2={width / 2}
            y2={height - 12}
            stroke={palette.stroke}
            strokeWidth="1.3"
            strokeDasharray="5 4"
            opacity="0.6"
          />
        )}

        {/* Edges */}
        {edges.map((edge, idx) => {
          const fromPos = positions[edge.from];
          const toPos = positions[edge.to];
          if (!fromPos || !toPos) return null;

          const x1 = fromPos.x + fromPos.w / 2;
          const y1 = fromPos.y + fromPos.h / 2;
          const x2 = toPos.x + toPos.w / 2;
          const y2 = toPos.y + toPos.h / 2;

          // Compute perimeter intersection roughly
          const dx = x2 - x1;
          const dy = y2 - y1;
          const angle = Math.atan2(dy, dx);
          const sx =
            Math.abs(Math.cos(angle)) * (fromPos.w / 2 + 4) > Math.abs(Math.sin(angle)) * (fromPos.h / 2 + 4)
              ? x1 + Math.sign(dx) * (fromPos.w / 2 + 2)
              : x1 + (dx * (fromPos.h / 2 + 2)) / (Math.abs(dy) || 1);
          const sy =
            Math.abs(Math.sin(angle)) > 0.5
              ? y1 + Math.sign(dy) * (fromPos.h / 2 + 2)
              : y1;

          const ex =
            Math.abs(Math.cos(angle)) * (toPos.w / 2 + 4) > Math.abs(Math.sin(angle)) * (toPos.h / 2 + 4)
              ? x2 - Math.sign(dx) * (toPos.w / 2 + 4)
              : x2 - (dx * (toPos.h / 2 + 4)) / (Math.abs(dy) || 1);
          const ey =
            Math.abs(Math.sin(angle)) > 0.5
              ? y2 - Math.sign(dy) * (toPos.h / 2 + 4)
              : y2;

          const midX = (sx + ex) / 2;
          const midY = (sy + ey) / 2 - 6;

          return (
            <g key={`edge-${idx}`}>
              <path
                d={`M ${sx} ${sy} Q ${midX} ${midY} ${ex} ${ey}`}
                fill="none"
                stroke={palette.stroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                markerEnd={`url(#${markerId})`}
              />
              {edge.label && (
                <text
                  x={midX}
                  y={midY - 3}
                  textAnchor="middle"
                  fill={palette.muted}
                  fontSize="10.5"
                  fontFamily={fontFamily}
                >
                  {truncateText(edge.label, 14)}
                </text>
              )}
            </g>
          );
        })}

        {/* Hand-drawn style boxes */}
        {nodes.map((node, idx) => {
          const pos = positions[node.id];
          if (!pos) return null;
          // Slight natural rotation per box for authentic pen-drawn character
          const tilt = idx % 2 === 0 ? -0.4 : 0.4;
          const cx = pos.x + pos.w / 2;
          const cy = pos.y + pos.h / 2;

          return (
            <g key={node.id} transform={`rotate(${tilt} ${cx} ${cy})`}>
              {/* Outer sketchy ink frame */}
              <rect
                x={pos.x}
                y={pos.y}
                width={pos.w}
                height={pos.h}
                rx="6"
                ry="6"
                fill={palette.fill}
                stroke={palette.stroke}
                strokeWidth="1.6"
              />
              {/* Subtle double-stroke hand-drawn detail */}
              <rect
                x={pos.x + 1.5}
                y={pos.y + 1.5}
                width={pos.w - 3}
                height={pos.h - 3}
                rx="5"
                ry="5"
                fill="none"
                stroke={palette.stroke}
                strokeWidth="0.5"
                opacity="0.45"
              />
              <text
                x={cx}
                y={node.sublabel ? pos.y + pos.h * 0.44 : pos.y + pos.h * 0.56}
                textAnchor="middle"
                fill={palette.stroke}
                fontSize="12.5"
                fontWeight="700"
                fontFamily={fontFamily}
              >
                {truncateText(node.label, 22)}
              </text>
              {node.sublabel && (
                <text
                  x={cx}
                  y={pos.y + pos.h * 0.77}
                  textAnchor="middle"
                  fill={palette.muted}
                  fontSize="10.5"
                  fontFamily={fontFamily}
                >
                  {truncateText(node.sublabel, 26)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
