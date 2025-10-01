
import React, { useMemo, useState } from 'react';
import type { Point } from '../types';

interface CoordinatePlaneProps {
    pointsToDraw: { A: Point, B?: Point, M?: Point };
    onPointSelect: (point: Point) => void;
    interactive: boolean;
    answerPoint: Point | null;
    correctAnswer: Point;
    showCorrectAnswer: boolean;
}

const VIEWBOX_SIZE = 400;
const GRID_RANGE = 10;
const PADDING = 25;
const CONTENT_SIZE = VIEWBOX_SIZE - 2 * PADDING;

const PointLabel: React.FC<{ point: Point, name: string, color: string, svgCoords: {x: number, y: number} }> = ({ point, name, color, svgCoords }) => (
    <text
        x={svgCoords.x + 8}
        y={svgCoords.y + 4}
        className={`fill-current ${color} text-sm font-bold select-none pointer-events-none`}
        style={{ fontSize: '10px' }}
    >
        {`${name}(x: ${point.x}, y: ${point.y})`}
    </text>
);

// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
export default function CoordinatePlane({
    pointsToDraw,
    onPointSelect,
    interactive,
    answerPoint,
    correctAnswer,
    showCorrectAnswer
}: CoordinatePlaneProps): React.ReactElement {
    const [hoverPoint, setHoverPoint] = useState<Point | null>(null);

    const toSvgCoords = (p: Point): { x: number, y: number } => {
        const x = PADDING + (p.x + GRID_RANGE) / (2 * GRID_RANGE) * CONTENT_SIZE;
        const y = PADDING + (GRID_RANGE - p.y) / (2 * GRID_RANGE) * CONTENT_SIZE;
        return { x, y };
    };
    
    const fromSvgCoords = (svgX: number, svgY: number): Point => {
        const x = ((svgX - PADDING) / CONTENT_SIZE) * (2 * GRID_RANGE) - GRID_RANGE;
        const y = GRID_RANGE - ((svgY - PADDING) / CONTENT_SIZE) * (2 * GRID_RANGE);
        return { x: Math.round(x), y: Math.round(y) };
    }

    const gridLines = useMemo(() => {
        const lines = [];
        for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
            const isOrigin = i === 0;
            const commonProps = {
                className: isOrigin ? "stroke-gray-400 dark:stroke-gray-500" : "stroke-gray-200 dark:stroke-gray-700",
                strokeWidth: isOrigin ? "1" : "0.5"
            };
            lines.push(<line key={`v${i}`} x1={toSvgCoords({x:i, y:0}).x} y1={PADDING} x2={toSvgCoords({x:i, y:0}).x} y2={VIEWBOX_SIZE-PADDING} {...commonProps} />);
            lines.push(<line key={`h${i}`} x1={PADDING} y1={toSvgCoords({x:0, y:i}).y} x2={VIEWBOX_SIZE-PADDING} y2={toSvgCoords({x:0, y:i}).y} {...commonProps} />);
        }
        return lines;
    }, []);

    const axisNumbers = useMemo(() => {
        const numbers = [];
        for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
            if (i !== 0 && i % 5 === 0) {
                 numbers.push(
                    <text key={`num-x-${i}`} x={toSvgCoords({x: i, y: 0}).x} y={toSvgCoords({x:0,y:0}).y + 12} fill="currentColor" fontSize="10" textAnchor="middle" className="select-none pointer-events-none">
                        {i}
                    </text>
                 );
                 numbers.push(
                    <text key={`num-y-${i}`} x={toSvgCoords({x:0,y:0}).x - 8} y={toSvgCoords({x: 0, y: i}).y + 3} fill="currentColor" fontSize="10" textAnchor="end" className="select-none pointer-events-none">
                        {i}
                    </text>
                 );
            }
        }
        return numbers;
    }, []);

    const getEventCoords = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>): {x: number, y: number} => {
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        const isTouchEvent = 'touches' in e;
        pt.x = isTouchEvent ? e.touches[0].clientX : e.clientX;
        pt.y = isTouchEvent ? e.touches[0].clientY : e.clientY;
        return pt.matrixTransform(svg.getScreenCTM()?.inverse());
    };
    
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!interactive) return;
        const { x, y } = getEventCoords(e);
        setHoverPoint(fromSvgCoords(x, y));
    };
    
    const handleMouseLeave = () => {
        setHoverPoint(null);
    };

    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!interactive) return;
        const { x, y } = getEventCoords(e);
        const selectedPoint = fromSvgCoords(x, y);
        onPointSelect(selectedPoint);
        setHoverPoint(null);
    };

    const { A, B, M } = pointsToDraw;
    const svgA = toSvgCoords(A);
    const svgB = B ? toSvgCoords(B) : null;
    const svgM = M ? toSvgCoords(M) : null;

    const svgAnswer = answerPoint ? toSvgCoords(answerPoint) : null;
    const svgCorrectAnswer = showCorrectAnswer ? toSvgCoords(correctAnswer) : null;
    const svgHover = hoverPoint ? toSvgCoords(hoverPoint) : null;

    return (
        <div className="aspect-square w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg p-4">
            <svg 
                viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} 
                onClick={handleClick} 
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={`cursor-${interactive ? 'crosshair' : 'default'} touch-none`}
            >
                {gridLines}
                {axisNumbers}
                {/* Axes Labels */}
                <text x={VIEWBOX_SIZE - PADDING + 8} y={toSvgCoords({x:0,y:0}).y + 4} fill="currentColor" fontSize="12" fontWeight="bold">x</text>
                <text x={toSvgCoords({x:0,y:0}).x - 12} y={PADDING - 8} fill="currentColor" fontSize="12" fontWeight="bold">y</text>

                {svgB && <line x1={svgA.x} y1={svgA.y} x2={svgB.x} y2={svgB.y} className="stroke-indigo-500/50" strokeWidth="2" strokeDasharray="4" />}
                
                {/* Points */}
                <circle cx={svgA.x} cy={svgA.y} r="5" className="fill-blue-500" />
                <PointLabel point={A} name="A" color="text-blue-600 dark:text-blue-400" svgCoords={svgA} />
                
                {svgB && B && <>
                    <circle cx={svgB.x} cy={svgB.y} r="5" className="fill-orange-500" />
                    <PointLabel point={B} name="B" color="text-orange-600 dark:text-orange-400" svgCoords={svgB} />
                </>}
                 {svgM && M && <>
                    <circle cx={svgM.x} cy={svgM.y} r="5" className="fill-pink-500" />
                    <PointLabel point={M} name="M" color="text-pink-600 dark:text-pink-400" svgCoords={svgM} />
                </>}

                {/* Hover point */}
                {svgHover && interactive && (
                    <circle cx={svgHover.x} cy={svgHover.y} r="5" className="fill-indigo-500/30" />
                )}

                {/* User's Answer */}
                {svgAnswer && !showCorrectAnswer && (
                     <g>
                        <circle cx={svgAnswer.x} cy={svgAnswer.y} r="6" className="fill-indigo-500 opacity-80" />
                        <text x={svgAnswer.x + 10} y={svgAnswer.y + 6} className="fill-indigo-500 text-sm font-bold" style={{ fontSize: '10px' }}>תשובה: ({answerPoint!.x},{answerPoint!.y})</text>
                    </g>
                )}
                
                {/* Feedback */}
                {showCorrectAnswer && answerPoint && (answerPoint.x !== correctAnswer.x || answerPoint.y !== correctAnswer.y) && svgAnswer &&(
                    <g>
                       <circle cx={svgAnswer.x} cy={svgAnswer.y} r="6" className="fill-red-500 opacity-80" />
                       <line x1={svgAnswer.x - 3} y1={svgAnswer.y - 3} x2={svgAnswer.x + 3} y2={svgAnswer.y + 3} stroke="white" strokeWidth="1.5" />
                       <line x1={svgAnswer.x + 3} y1={svgAnswer.y - 3} x2={svgAnswer.x - 3} y2={svgAnswer.y + 3} stroke="white" strokeWidth="1.5" />
                    </g>
                )}
                 {showCorrectAnswer && svgCorrectAnswer && (
                    <g>
                        <circle cx={svgCorrectAnswer.x} cy={svgCorrectAnswer.y} r="7" className="fill-green-500" />
                        <circle cx={svgCorrectAnswer.x} cy={svgCorrectAnswer.y} r="4" className="fill-white" />
                        <text x={svgCorrectAnswer.x + 10} y={svgCorrectAnswer.y + 6} className="fill-green-600 dark:fill-green-400 font-bold" style={{ fontSize: '10px' }}>נכון: ({correctAnswer.x},{correctAnswer.y})</text>
                    </g>
                )}

            </svg>
        </div>
    );
}
