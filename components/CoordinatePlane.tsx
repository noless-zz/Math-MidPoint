
import React, { useMemo } from 'react';
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
const PADDING = 20;
const CONTENT_SIZE = VIEWBOX_SIZE - 2 * PADDING;

// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
export default function CoordinatePlane({
    pointsToDraw,
    onPointSelect,
    interactive,
    answerPoint,
    correctAnswer,
    showCorrectAnswer
}: CoordinatePlaneProps): React.ReactElement {

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
            lines.push(<line key={`v${i}`} x1={toSvgCoords({x:i, y:0}).x} y1={PADDING} x2={toSvgCoords({x:i, y:0}).x} y2={VIEWBOX_SIZE-PADDING} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.5" />);
            lines.push(<line key={`h${i}`} x1={PADDING} y1={toSvgCoords({x:0, y:i}).y} x2={VIEWBOX_SIZE-PADDING} y2={toSvgCoords({x:0, y:i}).y} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.5" />);
        }
        return lines;
    }, []);

    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!interactive) return;
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        const selectedPoint = fromSvgCoords(x, y);
        onPointSelect(selectedPoint);
    };

    const { A, B, M } = pointsToDraw;
    const svgA = toSvgCoords(A);
    const svgB = B ? toSvgCoords(B) : null;
    const svgM = M ? toSvgCoords(M) : null;

    const svgAnswer = answerPoint ? toSvgCoords(answerPoint) : null;
    const svgCorrectAnswer = showCorrectAnswer ? toSvgCoords(correctAnswer) : null;

    return (
        <div className="aspect-square w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg p-4">
            <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} onClick={handleClick} className={`cursor-${interactive ? 'crosshair' : 'default'}`}>
                {gridLines}
                {/* Axes */}
                <line x1={toSvgCoords({x:-GRID_RANGE, y:0}).x} y1={toSvgCoords({x:0, y:0}).y} x2={toSvgCoords({x:GRID_RANGE, y:0}).x} y2={toSvgCoords({x:0, y:0}).y} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1.5" />
                <line x1={toSvgCoords({x:0, y:0}).x} y1={toSvgCoords({x:0, y:-GRID_RANGE}).y} x2={toSvgCoords({x:0, y:0}).x} y2={toSvgCoords({x:0, y:GRID_RANGE}).y} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1.5" />

                {svgB && <line x1={svgA.x} y1={svgA.y} x2={svgB.x} y2={svgB.y} stroke="#4f46e5" strokeWidth="2" strokeDasharray="4" />}
                
                {/* Points */}
                <circle cx={svgA.x} cy={svgA.y} r="5" className="fill-blue-500" />
                <text x={svgA.x + 8} y={svgA.y + 5} className="fill-current text-sm font-bold">A({A.x},{A.y})</text>
                
                {svgB && <>
                    <circle cx={svgB.x} cy={svgB.y} r="5" className="fill-orange-500" />
                    <text x={svgB.x + 8} y={svgB.y + 5} className="fill-current text-sm font-bold">B({B!.x},{B!.y})</text>
                </>}
                 {svgM && <>
                    <circle cx={svgM.x} cy={svgM.y} r="5" className="fill-pink-500" />
                    <text x={svgM.x + 8} y={svgM.y + 5} className="fill-current text-sm font-bold">M({M!.x},{M!.y})</text>
                </>}

                {/* User's Answer */}
                {svgAnswer && !showCorrectAnswer && (
                     <g>
                        <circle cx={svgAnswer.x} cy={svgAnswer.y} r="6" className="fill-indigo-500 opacity-80" />
                        <text x={svgAnswer.x + 10} y={svgAnswer.y + 6} className="fill-indigo-500 text-sm font-bold">תשובה: ({answerPoint!.x},{answerPoint!.y})</text>
                    </g>
                )}
                
                {/* Feedback */}
                {showCorrectAnswer && answerPoint && (answerPoint.x !== correctAnswer.x || answerPoint.y !== correctAnswer.y) && svgAnswer &&(
                    <g>
                       <circle cx={svgAnswer.x} cy={svgAnswer.y} r="6" className="fill-red-500 opacity-80" />
                       <line x1={svgAnswer.x} y1={svgAnswer.y} x2={svgAnswer.x-5} y2={svgAnswer.y-5} stroke="white" strokeWidth="2" />
                       <line x1={svgAnswer.x} y1={svgAnswer.y} x2={svgAnswer.x+5} y2={svgAnswer.y+5} stroke="white" strokeWidth="2" />
                       <line x1={svgAnswer.x} y1={svgAnswer.y} x2={svgAnswer.x-5} y2={svgAnswer.y+5} stroke="white" strokeWidth="2" />
                       <line x1={svgAnswer.x} y1={svgAnswer.y} x2={svgAnswer.x+5} y2={svgAnswer.y-5} stroke="white" strokeWidth="2" />
                    </g>
                )}
                 {showCorrectAnswer && svgCorrectAnswer && (
                    <g>
                        <circle cx={svgCorrectAnswer.x} cy={svgCorrectAnswer.y} r="7" className="fill-green-500" />
                        <circle cx={svgCorrectAnswer.x} cy={svgCorrectAnswer.y} r="4" className="fill-white" />
                        <text x={svgCorrectAnswer.x + 10} y={svgCorrectAnswer.y + 6} className="fill-green-500 text-sm font-bold">נכון: ({correctAnswer.x},{correctAnswer.y})</text>
                    </g>
                )}

            </svg>
        </div>
    );
}