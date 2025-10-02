import React, { useState, useRef, useCallback, useEffect } from 'react';

const Fraction: React.FC<{ numerator: React.ReactNode; denominator: React.ReactNode }> = ({ numerator, denominator }) => (
    <div className="inline-flex flex-col items-center align-middle">
        <span className="px-2">{numerator}</span>
        <hr className="w-full border-t-2 border-gray-700 dark:border-gray-200 my-1" />
        <span className="px-2">{denominator}</span>
    </div>
);

const MathDisplay: React.FC<{ variable: string; children: React.ReactNode }> = ({ variable, children }) => (
     <div className="flex items-center justify-center gap-2 text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-100">
        <span>{variable.charAt(0)}<sub>{variable.charAt(1)}</sub> =</span>
        {children}
    </div>
);

const FormulaBox: React.FC<{ title: string; children: React.ReactNode; explanation: string }> = ({ title, children, explanation }) => (
    <div className="bg-indigo-50 dark:bg-indigo-900/50 border-r-4 border-indigo-500 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-indigo-800 dark:text-indigo-200">{title}</h3>
        <div dir="ltr" className="my-4 p-4 bg-white dark:bg-gray-800 rounded-md text-center shadow-inner min-h-[80px] flex items-center justify-center">
            {children}
        </div>
        <p className="text-indigo-700 dark:text-indigo-300">{explanation}</p>
    </div>
);


const VIEWBOX_SIZE = 200;
const GRID_RANGE = 10;
const PADDING = 15;
const CONTENT_SIZE = VIEWBOX_SIZE - 2 * PADDING;

// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
export default function LearnSection(): React.ReactElement {
  const [pointA, setPointA] = useState({ x: -6, y: -5 });
  const [pointB, setPointB] = useState({ x: 4, y: 7 });
  const [draggedPoint, setDraggedPoint] = useState<'A' | 'B' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const pointM = {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  };

  const toSvgCoords = useCallback((p: {x: number, y: number}) => {
    const x = PADDING + (p.x + GRID_RANGE) / (2 * GRID_RANGE) * CONTENT_SIZE;
    const y = PADDING + (GRID_RANGE - p.y) / (2 * GRID_RANGE) * CONTENT_SIZE;
    return { x, y };
  }, []);

  const fromSvgCoords = useCallback((svgX: number, svgY: number) => {
    const x = ((svgX - PADDING) / CONTENT_SIZE) * (2 * GRID_RANGE) - GRID_RANGE;
    const y = GRID_RANGE - ((svgY - PADDING) / CONTENT_SIZE) * (2 * GRID_RANGE);
    return { x, y };
  }, []);

  const handleDragStart = (point: 'A' | 'B') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDraggedPoint(point);
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggedPoint || !svgRef.current) return;
    e.preventDefault();

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    const isTouchEvent = 'touches' in e;
    pt.x = isTouchEvent ? e.touches[0].clientX : e.clientX;
    pt.y = isTouchEvent ? e.touches[0].clientY : e.clientY;
    
    const svgPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    const coords = fromSvgCoords(svgPoint.x, svgPoint.y);

    const newPoint = {
        x: Math.round(Math.max(-GRID_RANGE, Math.min(GRID_RANGE, coords.x))),
        y: Math.round(Math.max(-GRID_RANGE, Math.min(GRID_RANGE, coords.y))),
    };

    if (draggedPoint === 'A') {
      setPointA(newPoint);
    } else {
      setPointB(newPoint);
    }
  }, [draggedPoint, fromSvgCoords]);

  const handleDragEnd = useCallback(() => {
    setDraggedPoint(null);
  }, []);

  useEffect(() => {
    if (draggedPoint) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [draggedPoint, handleDragMove, handleDragEnd]);
  
  const svgA = toSvgCoords(pointA);
  const svgB = toSvgCoords(pointB);
  const svgM = toSvgCoords(pointM);

  const gridLines = Array.from({ length: GRID_RANGE * 2 + 1 }, (_, i) => {
    const val = i - GRID_RANGE;
    const isOrigin = val === 0;
    const commonProps = {
      className: isOrigin ? "stroke-gray-400 dark:stroke-gray-500" : "stroke-gray-200 dark:stroke-gray-700",
      strokeWidth: isOrigin ? "1" : "0.5"
    };
    return (
        <React.Fragment key={i}>
            <line x1={toSvgCoords({x: val, y: 0}).x} y1={PADDING} x2={toSvgCoords({x: val, y: 0}).x} y2={VIEWBOX_SIZE - PADDING} {...commonProps} />
            <line x1={PADDING} y1={toSvgCoords({x: 0, y: val}).y} x2={VIEWBOX_SIZE - PADDING} y2={toSvgCoords({x: 0, y: val}).y} {...commonProps} />
        </React.Fragment>
    );
  });
  
  const axisNumbers = Array.from({ length: GRID_RANGE * 2 + 1 }, (_, i) => {
    const val = i - GRID_RANGE;
    if (val === 0 || val % 5 !== 0) return null;
    
    return (
        <React.Fragment key={`num-${val}`}>
            <text x={toSvgCoords({x: val, y: 0}).x} y={toSvgCoords({x:0,y:0}).y + 10} fill="currentColor" fontSize="6" textAnchor="middle" className="select-none pointer-events-none">
                {val}
            </text>
            <text x={toSvgCoords({x:0,y:0}).x - 5} y={toSvgCoords({x: 0, y: val}).y + 2} fill="currentColor" fontSize="6" textAnchor="end" className="select-none pointer-events-none">
                {val}
            </text>
        </React.Fragment>
    )
  });

  const exampleA = { x: -1, y: 3 };
  const exampleM = { x: 2, y: 5 };
  const exampleB = { x: 5, y: 7 };
  const svgExA = toSvgCoords(exampleA);
  const svgExM = toSvgCoords(exampleM);
  const svgExB = toSvgCoords(exampleB);


  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">אמצע של קטע</h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-10">
        בואו נלמד על הקשר בין שיעורי שתי נקודות המהוות קצות קטע, לבין שיעורי נקודת האמצע שלו.
      </p>

      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">הנוסחה הכללית</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
            כאשר נתון קטע AB שקצותיו הן הנקודות <span dir="ltr">A(x<sub>1</sub>, y<sub>1</sub>)</span> ו-<span dir="ltr">B(x<sub>2</sub>, y<sub>2</sub>)</span>, ונקודה M היא אמצע הקטע AB, אז מתקיים:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormulaBox 
                title="שיעור ה-X של נקודת האמצע"
                explanation="שיעור ה-X של נקודת האמצע הוא הממוצע של שיעורי ה-X של נקודות הקצה."
            >
                <MathDisplay variable="Xm">
                    <Fraction 
                        numerator={<><span dir="ltr">x<sub>1</sub></span> + <span dir="ltr">x<sub>2</sub></span></>}
                        denominator={<span>2</span>}
                    />
                </MathDisplay>
            </FormulaBox>
            <FormulaBox 
                title="שיעור ה-Y של נקודת האמצע"
                explanation="שיעור ה-Y של נקודת האמצע הוא הממוצע של שיעורי ה-Y של נקודות הקצה."
            >
                <MathDisplay variable="Ym">
                    <Fraction 
                        numerator={<><span dir="ltr">y<sub>1</sub></span> + <span dir="ltr">y<sub>2</sub></span></>}
                        denominator={<span>2</span>}
                    />
                </MathDisplay>
            </FormulaBox>
        </div>
      </div>

      <div className="text-center p-6 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">במילים אחרות...</h3>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          כדי למצוא את נקודת האמצע, פשוט מחשבים את הממוצע של קואורדינטות ה-X ואת הממוצע של קואורדינטות ה-Y בנפרד.
        </p>
      </div>

       <div className="mt-12">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">דוגמה ויזואלית אינטראקטיבית</h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">הזיזו את הנקודות A ו-B כדי לראות איך נקודת האמצע M והחישוב משתנים.</p>
            <div className={`flex justify-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg ${draggedPoint ? 'cursor-grabbing' : 'cursor-grab'}`}>
                 <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="w-full max-w-md touch-none">
                    {/* Grid lines and numbers */}
                    {gridLines}
                    {axisNumbers}
                    <line x1={PADDING} y1={toSvgCoords({x:0,y:0}).y} x2={VIEWBOX_SIZE-PADDING} y2={toSvgCoords({x:0,y:0}).y} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1.5" />
                    <line x1={toSvgCoords({x:0,y:0}).x} y1={PADDING} x2={toSvgCoords({x:0,y:0}).x} y2={VIEWBOX_SIZE-PADDING} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1.5" />
                    <text x={VIEWBOX_SIZE - PADDING + 2} y={toSvgCoords({x:0,y:0}).y + 4} fill="currentColor" fontSize="8">x</text>
                    <text x={toSvgCoords({x:0,y:0}).x - 6} y={PADDING - 2} fill="currentColor" fontSize="8">y</text>
                    
                    {/* Line AB */}
                    <line x1={svgA.x} y1={svgA.y} x2={svgB.x} y2={svgB.y} className="stroke-indigo-500" strokeWidth="2" strokeDasharray="4" />
                    
                    {/* Point M */}
                    <g className="pointer-events-none">
                      <circle cx={svgM.x} cy={svgM.y} r="5" className="fill-red-500" />
                      <circle cx={svgM.x} cy={svgM.y} r="2" className="fill-white" />
                      {/* FIX: Removed invalid 'dir' prop from SVG <text> element. */}
                      <text x={svgM.x + 8} y={svgM.y + 4} fill="currentColor" fontSize="8" fontWeight="bold" className="select-none">{`M(xm=${pointM.x}, ym=${pointM.y})`}</text>
                    </g>

                    {/* Point A */}
                    <g onMouseDown={handleDragStart('A')} onTouchStart={handleDragStart('A')} className="cursor-pointer">
                        <circle cx={svgA.x} cy={svgA.y} r="12" className="fill-transparent" />
                        <circle cx={svgA.x} cy={svgA.y} r="5" className="fill-green-500" />
                        {/* FIX: Removed invalid 'dir' prop from SVG <text> element. */}
                        <text x={svgA.x + 8} y={svgA.y + 4} fill="currentColor" fontSize="8" className="select-none pointer-events-none">{`A(xa=${pointA.x}, ya=${pointA.y})`}</text>
                    </g>
                    
                    {/* Point B */}
                    <g onMouseDown={handleDragStart('B')} onTouchStart={handleDragStart('B')} className="cursor-pointer">
                        <circle cx={svgB.x} cy={svgB.y} r="12" className="fill-transparent" />
                        <circle cx={svgB.x} cy={svgB.y} r="5" className="fill-orange-500" />
                        {/* FIX: Removed invalid 'dir' prop from SVG <text> element. */}
                        <text x={svgB.x + 8} y={svgB.y + 4} fill="currentColor" fontSize="8" className="select-none pointer-events-none">{`B(xb=${pointB.x}, yb=${pointB.y})`}</text>
                    </g>
                </svg>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div dir="ltr" className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg flex items-center justify-center">
                    <MathDisplay variable="Xm">
                        <div className="flex items-center gap-2">
                            <Fraction 
                                numerator={<><span>{pointA.x}</span> + <span>{pointB.x}</span></>}
                                denominator={<span>2</span>}
                            />
                            <span>= {pointM.x}</span>
                        </div>
                    </MathDisplay>
                </div>
                <div dir="ltr" className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg flex items-center justify-center">
                    <MathDisplay variable="Ym">
                        <div className="flex items-center gap-2">
                            <Fraction 
                                numerator={<><span>{pointA.y}</span> + <span>{pointB.y}</span></>}
                                denominator={<span>2</span>}
                            />
                            <span>= {pointM.y}</span>
                        </div>
                    </MathDisplay>
                </div>
            </div>
        </div>

      <div className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">מקרה הפוך: מציאת נקודת קצה</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          לפעמים, נתונה לנו נקודת האמצע M ונקודת קצה אחת (למשל A), ועלינו למצוא את נקודת הקצה השנייה (B). 
          נוכל לעשות זאת על ידי סידור מחדש של הנוסחה המקורית:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormulaBox 
                title="שיעור ה-X של נקודת הקצה"
                explanation="כדי למצוא את שיעור ה-X של נקודת הקצה, נכפיל את שיעור ה-X של האמצע ב-2 ונחסיר את שיעור ה-X של נקודת הקצה הנתונה."
            >
                <MathDisplay variable="Xb">
                    <span>2 &times; X<sub>m</sub> - x<sub>a</sub></span>
                </MathDisplay>
            </FormulaBox>
            <FormulaBox 
                title="שיעור ה-Y של נקודת הקצה"
                explanation="כדי למצוא את שיעור ה-Y של נקודת הקצה, נכפיל את שיעור ה-Y של האמצע ב-2 ונחסיר את שיעור ה-Y של נקודת הקצה הנתונה."
            >
                <MathDisplay variable="Yb">
                    <span>2 &times; Y<sub>m</sub> - y<sub>a</sub></span>
                </MathDisplay>
            </FormulaBox>
        </div>
        
        <div className="mt-8">
            <h4 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">דוגמה מספרית</h4>
            <div className="bg-gray-100 dark:bg-gray-700/50 p-6 rounded-lg">
                <p className="mb-4">
                    נניח שנקודה <span dir="ltr" className="font-mono font-semibold">M(2, 5)</span> היא אמצע קטע AB, ונתונה נקודה <span dir="ltr" className="font-mono font-semibold">A(-1, 3)</span>. כדי למצוא את נקודה B:
                </p>
                <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-md shadow-inner">
                    <div dir="ltr" className="flex items-center gap-3 text-lg">
                        <span className="font-bold w-16">X<sub>b</sub> =</span>
                        <span className="font-mono">(2 &times; 2) - (-1) = 4 + 1 = 5</span>
                    </div>
                    <div dir="ltr" className="flex items-center gap-3 text-lg">
                        <span className="font-bold w-16">Y<sub>b</sub> =</span>
                        <span className="font-mono">(2 &times; 5) - 3 = 10 - 3 = 7</span>
                    </div>
                </div>
                <p className="mt-4 font-semibold text-lg">
                    לכן, שיעורי הנקודה B הם <span dir="ltr" className="font-mono font-bold text-indigo-500">(5, 7)</span>.
                </p>
            </div>
             <div className="mt-8">
                <h5 className="text-xl font-semibold mb-3 text-center text-gray-800 dark:text-gray-100">הדגמה גרפית</h5>
                <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="w-full max-w-sm">
                        {gridLines}
                        {axisNumbers}
                        <line x1={PADDING} y1={toSvgCoords({x:0,y:0}).y} x2={VIEWBOX_SIZE-PADDING} y2={toSvgCoords({x:0,y:0}).y} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1.5" />
                        <line x1={toSvgCoords({x:0,y:0}).x} y1={PADDING} x2={toSvgCoords({x:0,y:0}).x} y2={VIEWBOX_SIZE-PADDING} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1.5" />
                        <text x={VIEWBOX_SIZE - PADDING + 2} y={toSvgCoords({x:0,y:0}).y + 4} fill="currentColor" fontSize="8">x</text>
                        <text x={toSvgCoords({x:0,y:0}).x - 6} y={PADDING - 2} fill="currentColor" fontSize="8">y</text>
                        
                        <line x1={svgExA.x} y1={svgExA.y} x2={svgExB.x} y2={svgExB.y} className="stroke-indigo-500" strokeWidth="2" strokeDasharray="4" />
                        
                        <g>
                            <circle cx={svgExA.x} cy={svgExA.y} r="5" className="fill-blue-500" />
                            <text x={svgExA.x + 8} y={svgExA.y - 4} fill="currentColor" fontSize="8" className="select-none pointer-events-none">{`A(-1, 3)`}</text>
                        </g>
                        <g>
                            <circle cx={svgExM.x} cy={svgExM.y} r="5" className="fill-pink-500" />
                            <text x={svgExM.x + 8} y={svgExM.y + 4} fill="currentColor" fontSize="8" fontWeight="bold" className="select-none pointer-events-none">{`M(2, 5)`}</text>
                        </g>
                        <g>
                            <circle cx={svgExB.x} cy={svgExB.y} r="5" className="fill-orange-500" />
                            <text x={svgExB.x + 8} y={svgExB.y + 4} fill="currentColor" fontSize="8" className="select-none pointer-events-none">{`B(5, 7) = ?`}</text>
                        </g>
                    </svg>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}