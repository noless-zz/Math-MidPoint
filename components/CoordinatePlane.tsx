import React, { useRef, useMemo, useCallback } from 'react';
import { Point } from '../types.ts';
import { design } from '../constants/design_system.ts';

interface CoordinatePlaneProps {
  points?: { [key: string]: Point };
  lines?: { p1: Point; p2: Point; color: string }[];
  triangle?: [Point, Point, Point];
  onClick?: (point: Point) => void;
  userAnswer?: Point | null;
  solution?: Point | null;
}

const VIEWBOX_SIZE = 400;
const PADDING = 25; // Increased padding for labels

const CoordinatePlane: React.FC<CoordinatePlaneProps> = ({ points = {}, lines = [], triangle, onClick, userAnswer, solution }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // 1. Auto-zoom logic to create a dynamic view
  const { xRange, yRange, center } = useMemo(() => {
    const allPoints: Point[] = Object.values(points).filter(Boolean).map(p => p);
    
    lines.forEach(line => {
      if (line.p1) allPoints.push(line.p1);
      if (line.p2) allPoints.push(line.p2);
    });

    if (triangle) allPoints.push(...triangle);
    if (userAnswer) allPoints.push(userAnswer);
    if (solution) allPoints.push(solution);
    
    // Add origin to ensure axes are considered in the bounding box calculation
    if (allPoints.length > 0) {
        allPoints.push({ x: 0, y: 0 });
    }

    if (allPoints.length === 0) {
      return { xRange: 15, yRange: 15, center: { x: 0, y: 0 } };
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allPoints.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const spanX = Math.abs(maxX - minX);
    const spanY = Math.abs(maxY - minY);

    const paddingX = Math.max(2, spanX * 0.15);
    const paddingY = Math.max(2, spanY * 0.15);

    const range = Math.max((spanX + paddingX * 2) / 2, (spanY + paddingY * 2) / 2, 2);

    return {
      xRange: range,
      yRange: range,
      center: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
      },
    };
  }, [points, lines, triangle, userAnswer, solution]);

  // 2. Updated coordinate conversion functions using dynamic range
  const toSvgCoords = useCallback((p: Point): { x: number; y: number } => {
    const contentSize = VIEWBOX_SIZE - 2 * PADDING;
    const x = PADDING + ((p.x - (center.x - xRange)) / (2 * xRange)) * contentSize;
    const y = PADDING + (((center.y + yRange) - p.y) / (2 * yRange)) * contentSize;
    return { x, y };
  }, [xRange, yRange, center]);

  const fromSvgCoords = useCallback((svgX: number, svgY: number): Point => {
    const contentSize = VIEWBOX_SIZE - 2 * PADDING;
    const x = ((svgX - PADDING) / contentSize) * (2 * xRange) + (center.x - xRange);
    const y = (center.y + yRange) - ((svgY - PADDING) / contentSize) * (2 * yRange);
    return { x: Math.round(x), y: Math.round(y) };
  }, [xRange, yRange, center]);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onClick || !svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    const coords = fromSvgCoords(svgPoint.x, svgPoint.y);
    onClick(coords);
  };

  const gridLinesAndLabels = useMemo(() => {
    const elements = [];
    const step = Math.pow(10, Math.floor(Math.log10(xRange))) / 2 || 1;
    const gridStep = [1, 2, 5, 10, 20, 50].map(s => s * step).find(s => (xRange * 2 / s) < 20) || step * 5;
    
    const origin = toSvgCoords({ x: 0, y: 0 });

    // --- Smart positioning for numeric labels ---
    let xAxisLabelY;
    if (origin.y < PADDING + 10) { // Axis off-screen top or too close
        xAxisLabelY = VIEWBOX_SIZE - PADDING + 15;
    } else if (origin.y > VIEWBOX_SIZE - (PADDING + 10)) { // Axis off-screen bottom or too close
        xAxisLabelY = PADDING;
    } else { // Axis is comfortably in view
        xAxisLabelY = origin.y + 12;
    }

    let yAxisLabelX;
    let yAxisLabelAnchor: 'start' | 'end';
    if (origin.x < PADDING + 10) { // Axis off-screen left or too close
        yAxisLabelX = PADDING;
        yAxisLabelAnchor = 'start';
    } else if (origin.x > VIEWBOX_SIZE - (PADDING + 10)) { // Axis off-screen right or too close
        yAxisLabelX = VIEWBOX_SIZE - PADDING;
        yAxisLabelAnchor = 'end';
    } else { // Axis is comfortably in view
        yAxisLabelX = origin.x - 10;
        yAxisLabelAnchor = 'end';
    }
    
    // --- Draw Vertical gridlines & X-axis labels ---
    const startX = Math.floor((center.x - xRange) / gridStep) * gridStep;
    const endX = Math.ceil((center.x + xRange) / gridStep) * gridStep;
    for (let i = startX; i <= endX; i += gridStep) {
        const x = Math.round(i * 100) / 100;
        const isAxis = Math.abs(x) < 0.001;
        const svgX = toSvgCoords({ x, y: 0 }).x;
        elements.push(<line key={`v-${x}`} x1={svgX} y1={0} x2={svgX} y2={VIEWBOX_SIZE} className={isAxis ? "stroke-gray-400 dark:stroke-gray-500" : "stroke-gray-200 dark:stroke-gray-700"} strokeWidth={isAxis ? 1 : 0.5} />);
        if (!isAxis) {
            elements.push(<text key={`v-label-${x}`} x={svgX} y={xAxisLabelY} textAnchor="middle" className="fill-current text-[10px]">{`\u200E${x}`}</text>);
        } else {
            elements.push(<text key={`v-label-0`} x={svgX + 2} y={xAxisLabelY} textAnchor="start" className="fill-current text-[10px]">0</text>);
        }
    }

    // --- Draw Horizontal gridlines & Y-axis labels ---
    const startY = Math.floor((center.y - yRange) / gridStep) * gridStep;
    const endY = Math.ceil((center.y + yRange) / gridStep) * gridStep;
    for (let i = startY; i <= endY; i += gridStep) {
        const y = Math.round(i * 100) / 100;
        const isAxis = Math.abs(y) < 0.001;
        const svgY = toSvgCoords({ x: 0, y }).y;
        elements.push(<line key={`h-${y}`} x1={0} y1={svgY} x2={VIEWBOX_SIZE} y2={svgY} className={isAxis ? "stroke-gray-400 dark:stroke-gray-500" : "stroke-gray-200 dark:stroke-gray-700"} strokeWidth={isAxis ? 1 : 0.5} />);
        if (!isAxis) {
            elements.push(<text key={`h-label-${y}`} x={yAxisLabelX} y={svgY + 4} textAnchor={yAxisLabelAnchor} className="fill-current text-[10px]">{`\u200E${y}`}</text>);
        }
    }

    // --- Draw 'x' and 'y' axis identifiers ---
    const visibleOriginY = Math.max(PADDING, Math.min(VIEWBOX_SIZE - PADDING, origin.y));
    const visibleOriginX = Math.max(PADDING, Math.min(VIEWBOX_SIZE - PADDING, origin.x));

    elements.push(<text key="x-axis-label" x={VIEWBOX_SIZE - PADDING + 10} y={visibleOriginY + 4} textAnchor="start" className="fill-current text-sm font-bold">x</text>);
    elements.push(<text key="y-axis-label" x={visibleOriginX - 4} y={PADDING - 10} textAnchor="end" className="fill-current text-sm font-bold">y</text>);

    return elements;
  }, [xRange, yRange, center, toSvgCoords]);

  // 3. Intelligent label placement logic
  const getLabelPosition = (svgP: { x: number; y: number }) => {
    const offsetX = 12;
    const offsetY = 6;
    let x = svgP.x;
    let y = svgP.y - offsetY - 6; // Default above
    let textAnchor: 'middle' | 'start' | 'end' = 'middle';

    if (svgP.y < PADDING * 2) { // Too close to top
      y = svgP.y + offsetY + 12;
    }
    if (svgP.x < PADDING * 2.5) { // Too close to left
      textAnchor = 'start';
      x = svgP.x + offsetX;
    }
    if (svgP.x > VIEWBOX_SIZE - PADDING * 2.5) { // Too close to right
      textAnchor = 'end';
      x = svgP.x - offsetX;
    }
    return { x, y, textAnchor };
  };

  return (
    <svg 
      ref={svgRef} 
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} 
      className="w-full h-auto aspect-square bg-white dark:bg-gray-800/50 rounded-lg shadow-inner border border-gray-200 dark:border-gray-700 touch-none cursor-crosshair"
      onClick={handleClick}
    >
      {gridLinesAndLabels}
      
      {triangle && (
        <polygon 
          points={triangle.map(p => `${toSvgCoords(p).x},${toSvgCoords(p).y}`).join(' ')}
          className="fill-indigo-500/20 stroke-indigo-500 stroke-2"
        />
      )}

      {lines.map((line, index) => {
        const svgP1 = toSvgCoords(line.p1);
        const svgP2 = toSvgCoords(line.p2);
        return <line key={`line-${index}`} x1={svgP1.x} y1={svgP1.y} x2={svgP2.x} y2={svgP2.y} className={line.color} strokeWidth="2" />;
      })}

      {Object.entries(points).map(([key, p]) => {
        if (!p) return null;
        const svgP = toSvgCoords(p);
        const { x: labelX, y: labelY, textAnchor } = getLabelPosition(svgP);
        const color = design.pointColors[key]?.fill || 'fill-gray-500';
        return (
          <g key={`point-group-${key}`}>
            <circle cx={svgP.x} cy={svgP.y} r="6" className={color} />
            <text x={labelX} y={labelY} className="fill-current text-sm select-none pointer-events-none font-bold" style={{ textAnchor }}>
              {`${key}(${`\u200E${p.x}`},${`\u200E${p.y}`})`}
            </text>
          </g>
        );
      })}

      {userAnswer && (
        <g>
          <circle cx={toSvgCoords(userAnswer).x} cy={toSvgCoords(userAnswer).y} r="8" className={`fill-${design.colors.accent.green} opacity-70`} />
          {(() => {
            const svgP = toSvgCoords(userAnswer);
            const { x: labelX, y: labelY, textAnchor } = getLabelPosition(svgP);
            return (
              <text x={labelX} y={labelY} className="fill-current text-sm select-none pointer-events-none font-bold" style={{ textAnchor }}>
                {`תשובה (${`\u200E${userAnswer.x}`},${`\u200E${userAnswer.y}`})`}
              </text>
            );
          })()}
        </g>
      )}

      {solution && (
        <g>
          <circle cx={toSvgCoords(solution).x} cy={toSvgCoords(solution).y} r="5" className={`fill-none stroke-${design.colors.accent.purple} stroke-2`} strokeDasharray="3 3" />
           <text x={toSvgCoords(solution).x + 10} y={toSvgCoords(solution).y - 10} className={`fill-${design.colors.accent.purple} text-sm select-none pointer-events-none font-bold`}>
            פתרון
          </text>
        </g>
      )}
    </svg>
  );
};

export default CoordinatePlane;