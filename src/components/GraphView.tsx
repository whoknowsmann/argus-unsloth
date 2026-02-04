import { useEffect, useMemo, useState } from 'react';
import type { GraphData } from '../types';

const WIDTH = 680;
const HEIGHT = 420;

const GraphView = ({
  open,
  activePath,
  onClose,
  onOpenNote
}: {
  open: boolean;
  activePath: string | null;
  onClose: () => void;
  onOpenNote: (path: string) => void;
}) => {
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!activePath) {
      setGraph(null);
      return;
    }
    setLoading(true);
    window.vaultApi
      .getLocalGraph(activePath)
      .then((data) => setGraph(data as GraphData))
      .finally(() => setLoading(false));
  }, [activePath, open]);

  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];

  const layout = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    if (!activePath) {
      return positions;
    }
    const center = { x: WIDTH / 2, y: HEIGHT / 2 };
    positions.set(activePath, center);
    const neighbors = nodes.filter((node) => node.path !== activePath);
    if (neighbors.length === 0) {
      return positions;
    }
    const radius = Math.min(WIDTH, HEIGHT) * 0.32;
    neighbors.forEach((node, index) => {
      const angle = (index / neighbors.length) * Math.PI * 2;
      positions.set(node.path, {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      });
    });
    return positions;
  }, [activePath, nodes]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal graph-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">Graph View</div>
        <div className="modal-subtitle">Local graph for the current note with 1-hop links.</div>
        {!activePath && <div className="empty">Open a note to generate its graph.</div>}
        {activePath && loading && <div className="empty">Loading graph…</div>}
        {activePath && !loading && nodes.length <= 1 && (
          <div className="empty">No linked notes yet.</div>
        )}
        {activePath && !loading && nodes.length > 0 && (
          <div className="graph-canvas">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="100%">
              {edges.map((edge) => {
                const source = layout.get(edge.from);
                const target = layout.get(edge.to);
                if (!source || !target) {
                  return null;
                }
                return (
                  <line
                    key={`${edge.from}-${edge.to}`}
                    className="graph-edge"
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                  />
                );
              })}
              {nodes.map((node) => {
                const position = layout.get(node.path);
                if (!position) {
                  return null;
                }
                const isActive = node.path === activePath;
                return (
                  <g
                    key={node.path}
                    className={`graph-node ${isActive ? 'active' : ''}`}
                    onClick={() => onOpenNote(node.path)}
                  >
                    <title>{`${node.title}\n${node.path}`}</title>
                    <circle cx={position.x} cy={position.y} r={isActive ? 18 : 14} />
                    {isActive && (
                      <text x={position.x} y={position.y + 34} textAnchor="middle">
                        {node.title}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <div className="graph-meta">{nodes.length} nodes · {edges.length} edges</div>
          </div>
        )}
        {graph?.truncated && graph.totalNodes && (
          <div className="graph-warning">Showing {nodes.length} of {graph.totalNodes} nodes.</div>
        )}
        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default GraphView;
