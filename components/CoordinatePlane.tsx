import React, { useMemo, useState } from 'react';

const VIEWBOX_SIZE = 400;
const GRID_RANGE = 10;
const PADDING = 25;
const CONTENT_SIZE = VIEWBOX_SIZE - 2 * PADDING;

export default function CoordinatePlane({
    pointsToDraw,
    onPointSelect,
    interactive,
    answerPoint,
    correctAnswer,
    showCorrectAnswer
}) {
    const [hoverPoint, setHoverPoint] = useState(null);

    const toSvgCoords = (p) => {
        const x = PADDING + (p.x + GRID_RANGE) / (2 * GRID_RANGE) * CONTENT_SIZE;
        const y = PADDING + (GRID_RANGE - p.y) / (2 * GRID_RANGE) * CONTENT_SIZE;
        return { x, y };
    };
    
    const fromSvgCoords = (svgX, svgY) => {
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

    const labelPositions = useMemo(() => {
        const allPointsToLabel = [];
        const { A, B, M } = pointsToDraw;

        allPointsToLabel.push({ id: 'A', point: A, rtlText: 'A', ltrText: `(${A.x}, ${A.y})`, color: 'text-blue-600 dark:text-blue-400' });
        if (B) allPointsToLabel.push({ id: 'B', point: B, rtlText: 'B', ltrText: `(${B.x}, ${B.y})`, color: 'text-orange-600 dark:text-orange-400' });
        if (M) allPointsToLabel.push({ id: 'M', point: M, rtlText: 'M', ltrText: `(${M.x}, ${M.y})`, color: 'text-pink-600 dark:text-pink-400' });

        if (showCorrectAnswer) {
            allPointsToLabel.push({
                id: 'correct',
                point: correctAnswer,
                rtlText: `נכון: `,
                ltrText: `(${correctAnswer.x},${correctAnswer.y})`,
                color: 'fill-green-600 dark:fill-green-400',
            });
            if (answerPoint && (answerPoint.x !== correctAnswer.x || answerPoint.y !== correctAnswer.y)) {
                allPointsToLabel.push({
                    id: 'user_wrong',
                    point: answerPoint,
                    rtlText: `התשובה שלך`,
                    ltrText: ``,
                    color: 'fill-red-600 dark:fill-red-400',
                });
            }
        } else if (answerPoint) {
            allPointsToLabel.push({
                id: 'user_answer',
                point: answerPoint,
                rtlText: `תשובה: `,
                ltrText: `(${answerPoint.x},${answerPoint.y})`,
                color: 'fill-indigo-500',
            });
        }
        
        const positions = new Map();
        const occupiedRects = [];
        
        const candidates = [
            { anchor: 'start', dx: 8, dy: 14 }, // bottom-right
            { anchor: 'end', dx: -8, dy: -4 },  // top-left
            { anchor: 'start', dx: 8, dy: -4 }, // top-right
            { anchor: 'end', dx: -8, dy: 14 },  // bottom-left
        ];

        allPointsToLabel.forEach(labelInfo => {
            const svgCoords = toSvgCoords(labelInfo.point);
            const fullLabelLength = (labelInfo.rtlText.length + labelInfo.ltrText.length);
            
            let bestPos = null;

            for (const cand of candidates) {
                const labelWidth = fullLabelLength * 5.5; 
                const labelHeight = 10;
                const textX = svgCoords.x + cand.dx;
                const textY = svgCoords.y + cand.dy;

                const rect = {
                    x: cand.anchor === 'start' ? textX : textX - labelWidth,
                    y: textY - labelHeight,
                    width: labelWidth,
                    height: labelHeight
                };
                
                if (rect.x < PADDING/2 || rect.x + rect.width > VIEWBOX_SIZE - PADDING/2 ||
                    rect.y < PADDING/2 || rect.y + rect.height > VIEWBOX_SIZE - PADDING/2) {
                    continue; 
                }

                let isOverlapping = false;
                for (const region of occupiedRects) {
                    if (rect.x < region.x + region.width && rect.x + rect.width > region.x &&
                        rect.y < region.y + region.height && rect.y + rect.height > region.y) {
                        isOverlapping = true;
                        break;
                    }
                }

                if (!isOverlapping) {
                    bestPos = { x: textX, y: textY, textAnchor: cand.anchor };
                    occupiedRects.push(rect);
                    break;
                }
            }

            if (!bestPos) {
                const cand = candidates[0];
                bestPos = { x: svgCoords.x + cand.dx, y: svgCoords.y + cand.dy, textAnchor: cand.anchor };
            }
            positions.set(labelInfo.id, { ...bestPos, rtlText: labelInfo.rtlText, ltrText: labelInfo.ltrText, color: labelInfo.color });
        });

        return Array.from(positions.entries());
    }, [pointsToDraw, answerPoint, correctAnswer, showCorrectAnswer]);


    const getEventCoords = (e) => {
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        const isTouchEvent = 'touches' in e;
        pt.x = isTouchEvent ? e.touches[0].clientX : e.clientX;
        pt.y = isTouchEvent ? e.touches[0].clientY : e.clientY;
        return pt.matrixTransform(svg.getScreenCTM()?.inverse());
    };
    
    const handleMouseMove = (e) => {
        if (!interactive) return;
        const { x, y } = getEventCoords(e);
        setHoverPoint(fromSvgCoords(x, y));
    };
    
    const handleMouseLeave = () => {
        setHoverPoint(null);
    };

    const handleClick = (e) => {
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
                
                {svgB && B && <>
                    <circle cx={svgB.x} cy={svgB.y} r="5" className="fill-orange-500" />
                </>}
                 {svgM && M && <>
                    <circle cx={svgM.x} cy={svgM.y} r="5" className="fill-pink-500" />
                </>}

                {/* Hover point */}
                {svgHover && interactive && (
                    <circle cx={svgHover.x} cy={svgHover.y} r="5" className="fill-indigo-500/30" />
                )}

                {/* User's Answer before feedback */}
                {svgAnswer && !showCorrectAnswer && (
                    <circle cx={svgAnswer.x} cy={svgAnswer.y} r="6" className="fill-indigo-500 opacity-80" />
                )}
                
                {/* Feedback points */}
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
                    </g>
                )}
                
                {/* Smart Labels */}
                {labelPositions.map(([id, props]) => (
                    <text
                        key={id}
                        x={props.x}
                        y={props.y}
                        textAnchor={props.textAnchor}
                        className={`${props.color} text-sm font-bold select-none pointer-events-none`}
                        style={{ fontSize: '10px' }}
                    >
                        {props.rtlText}
                        <tspan className="font-mono" dx="2">{props.ltrText}</tspan>
                    </text>
                ))}


            </svg>
        </div>
    );
}