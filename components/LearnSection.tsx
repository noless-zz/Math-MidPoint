import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { SUBJECTS, Subject } from '../types.ts';
import { design } from '../constants/design_system.ts';

// --- SHARED LEARNING COMPONENTS ---
const ContentPage = ({ title, intro = null, children }) => (
    <div className={design.learn.contentPage}>
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">{title}</h2>
      {intro && <p className={`text-lg ${design.colors.text.muted.light} dark:${design.colors.text.muted.dark} text-center mb-10`}>{intro}</p>}
      <div className="space-y-12">{children}</div>
    </div>
);

const Section = ({ title, children }) => (
    <div>
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <div className={design.learn.section}>{children}</div>
    </div>
);

const Example = ({ title, children, isHebrew = true }) => (
    <div className={`${design.learn.example} ${isHebrew ? 'text-right' : 'text-left'}`}>
        <h4 className="font-bold text-teal-800 dark:text-teal-200 text-lg mb-3">{title}</h4>
        <div className="space-y-2">{children}</div>
    </div>
);

const Formula = ({ title = null, children, explanation = null }) => (
     <div className={design.learn.formula}>
        {title && <h3 className="text-xl font-semibold text-indigo-800 dark:text-indigo-200">{title}</h3>}
        <div dir="ltr" className="my-4 p-4 bg-white dark:bg-gray-800 rounded-md text-center shadow-inner min-h-[60px] flex items-center justify-center">
            {children}
        </div>
        {explanation && <p className="text-indigo-700 dark:text-indigo-300">{explanation}</p>}
    </div>
);

const ImportantNote = ({ children }) => (
    <div className={design.learn.importantNote}>
        <p><span className="font-bold">הערה חשובה:</span> {children}</p>
    </div>
);

const StaticGraph = ({ width=250, height=250, range=5, children, title }) => (
    <div className="flex flex-col items-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
            {/* Grid & Axes */}
            <defs>
                <pattern id="smallGrid" width={width/(2*range)} height={height/(2*range)} patternUnits="userSpaceOnUse">
                    <path d={`M ${width/(2*range)} 0 L 0 0 0 ${height/(2*range)}`} fill="none" stroke="rgba(229,231,235,1)" strokeWidth="0.5" />
                </pattern>
                 <pattern id="smallGridDark" width={width/(2*range)} height={height/(2*range)} patternUnits="userSpaceOnUse">
                    <path d={`M ${width/(2*range)} 0 L 0 0 0 ${height/(2*range)}`} fill="none" stroke="rgba(55,65,81,1)" strokeWidth="0.5" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#smallGrid)" className="dark:hidden" />
            <rect width="100%" height="100%" fill="url(#smallGridDark)" className="hidden dark:block" />

            <path d={`M 0 ${height/2} L ${width} ${height/2}`} stroke="currentColor" strokeWidth="1.5" />
            <path d={`M ${width/2} 0 L ${width/2} ${height}`} stroke="currentColor" strokeWidth="1.5" />
             <text x={width - 10} y={height/2 + 15} fontSize="12" fill="currentColor">x</text>
             <text x={width/2 - 15} y={15} fontSize="12" fill="currentColor">y</text>
            
            {children}
        </svg>
        {title && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>}
    </div>
);

const GraphLine = ({ m, b, range, width, height, color="stroke-blue-500" }) => {
    const y1 = height/2 - (m * (-range) + b) * (height/(2*range));
    const y2 = height/2 - (m * range + b) * (height/(2*range));
    return <line x1="0" y1={y1} x2={width} y2={y2} className={color} strokeWidth="2" />;
};

const GraphVLine = ({ x, range, width, height, color="stroke-blue-500" }) => {
    const xPos = width/2 + x * (width/(2*range));
    return <line x1={xPos} y1="0" x2={xPos} y2={height} className={color} strokeWidth="2" />;
};


// --- MIDPOINT CONTENT ---
const Fraction = ({ numerator, denominator }) => (
    <div className="inline-flex flex-col items-center align-middle mx-2">
        <span className="px-2">{numerator}</span>
        <hr className="w-full border-t-2 border-gray-700 dark:border-gray-200 my-1" />
        <span className="px-2">{denominator}</span>
    </div>
);

const MathDisplay = ({ variable, children }) => (
     <div className="flex items-center justify-center gap-2 text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-100">
        <span>{variable.charAt(0)}<sub>{variable.charAt(1)}</sub> =</span>
        {children}
    </div>
);

const VIEWBOX_SIZE = 200;
const GRID_RANGE = 10;
const PADDING = 15;
const CONTENT_SIZE = VIEWBOX_SIZE - 2 * PADDING;

const MidpointLearnContent = () => {
  const [pointA, setPointA] = useState({ x: -6, y: -5 });
  const [pointB, setPointB] = useState({ x: 4, y: 7 });
  const [draggedPoint, setDraggedPoint] = useState(null);
  const svgRef = useRef(null);
  const pointM = useMemo(() => ({
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  }), [pointA, pointB]);

  const toSvgCoords = useCallback((p) => ({
    x: PADDING + (p.x + GRID_RANGE) / (2 * GRID_RANGE) * CONTENT_SIZE,
    y: PADDING + (GRID_RANGE - p.y) / (2 * GRID_RANGE) * CONTENT_SIZE,
  }), []);

  const fromSvgCoords = useCallback((svgX, svgY) => ({
    x: ((svgX - PADDING) / CONTENT_SIZE) * (2 * GRID_RANGE) - GRID_RANGE,
    y: GRID_RANGE - ((svgY - PADDING) / CONTENT_SIZE) * (2 * GRID_RANGE),
  }), []);

  const handleDragStart = useCallback((point) => (e) => {
    e.preventDefault();
    setDraggedPoint(point);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedPoint(null);
  }, []);

  const handleDragMove = useCallback((e) => {
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

  const gridLines = useMemo(() => Array.from({ length: GRID_RANGE * 2 + 1 }, (_, i) => {
    const coord = -GRID_RANGE + i;
    const isOrigin = coord === 0;
    const pos = toSvgCoords({ x: coord, y: coord });
    const darkClass = isOrigin ? 'dark:stroke-gray-600' : 'dark:stroke-gray-700';
    return (
      <React.Fragment key={`grid-${i}`}>
        <line x1={pos.x} y1={PADDING} x2={pos.x} y2={VIEWBOX_SIZE - PADDING} className={`stroke-gray-300 ${darkClass}`} strokeWidth={isOrigin ? 0.8 : 0.4} />
        <line x1={PADDING} y1={pos.y} x2={VIEWBOX_SIZE - PADDING} y2={pos.y} className={`stroke-gray-300 ${darkClass}`} strokeWidth={isOrigin ? 0.8 : 0.4} />
      </React.Fragment>
    );
  }), [toSvgCoords]);

  const exampleA = { x: -1, y: 3 };
  const exampleM = { x: 2, y: 5 };
  const exampleB = { x: 5, y: 7 };
  const svgExA = toSvgCoords(exampleA);
  const svgExM = toSvgCoords(exampleM);
  const svgExB = toSvgCoords(exampleB);

  return (
    <ContentPage title="אמצע של קטע" intro="בואו נלמד על הקשר בין שיעורי שתי נקודות המהוות קצות קטע, לבין שיעורי נקודת האמצע שלו.">
        <Section title="הנוסחה הכללית">
            <p>כאשר נתון קטע AB שקצותיו הן הנקודות <span dir="ltr">A(x<sub>1</sub>, y<sub>1</sub>)</span> ו-<span dir="ltr">B(x<sub>2</sub>, y<sub>2</sub>)</span>, ונקודה M היא אמצע הקטע AB, אז מתקיים:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Formula title="שיעור ה-X של נקודת האמצע" explanation="שיעור ה-X של נקודת האמצע הוא הממוצע של שיעורי ה-X של נקודות הקצה.">
                    <MathDisplay variable="Xm">
                        <Fraction numerator={<><span dir="ltr">x<sub>1</sub></span> + <span dir="ltr">x<sub>2</sub></span></>} denominator={<span>2</span>} />
                    </MathDisplay>
                </Formula>
                <Formula title="שיעור ה-Y של נקודת האמצע" explanation="שיעור ה-Y של נקודת האמצע הוא הממוצע של שיעורי ה-Y של נקודות הקצה.">
                    <MathDisplay variable="Ym">
                        <Fraction numerator={<><span dir="ltr">y<sub>1</sub></span> + <span dir="ltr">y<sub>2</sub></span></>} denominator={<span>2</span>} />
                    </MathDisplay>
                </Formula>
            </div>
        </Section>
        
        <Section title="דוגמה אינטראקטיבית">
            <p>גרור/י את הנקודות <span className={`font-bold ${design.pointColors.A.text}`}>A</span> ו-<span className={`font-bold ${design.pointColors.B.text}`}>B</span> על הגרף כדי לראות כיצד נקודת האמצע <span className={`font-bold ${design.pointColors.M.text}`}>M</span> משתנה בזמן אמת.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="w-full h-auto aspect-square bg-white dark:bg-gray-800/50 rounded-lg shadow-inner border border-gray-200 dark:border-gray-700 touch-none">
                    {gridLines}
                    <line x1={svgA.x} y1={svgA.y} x2={svgB.x} y2={svgB.y} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" />
                    <circle cx={svgA.x} cy={svgA.y} r="8" className={`${design.pointColors.A.fill} cursor-grab`} onMouseDown={handleDragStart('A')} onTouchStart={handleDragStart('A')} />
                    <circle cx={svgB.x} cy={svgB.y} r="8" className={`${design.pointColors.B.fill} cursor-grab`} onMouseDown={handleDragStart('B')} onTouchStart={handleDragStart('B')} />
                    <circle cx={svgM.x} cy={svgM.y} r="6" className={`${design.pointColors.M.fill}`} />
                    <text x={svgA.x + 10} y={svgA.y + 5} className="fill-current text-sm select-none pointer-events-none">A</text>
                    <text x={svgB.x + 10} y={svgB.y + 5} className="fill-current text-sm select-none pointer-events-none">B</text>
                    <text x={svgM.x + 10} y={svgM.y + 5} className="fill-current text-sm select-none pointer-events-none">M</text>
                </svg>

                <div className="space-y-4">
                    <div className="flex justify-around text-center text-lg">
                        <p><span className={`font-bold ${design.pointColors.A.text}`}>A:</span> <span dir="ltr">({pointA.x}, {pointA.y})</span></p>
                        <p><span className={`font-bold ${design.pointColors.B.text}`}>B:</span> <span dir="ltr">({pointB.x}, {pointB.y})</span></p>
                        <p><span className={`font-bold ${design.pointColors.M.text}`}>M:</span> <span dir="ltr">({pointM.x}, {pointM.y})</span></p>
                    </div>
                    <Formula explanation="חישוב שיעור X">
                        <MathDisplay variable="Xm">
                            <Fraction numerator={<>{pointA.x} + ({pointB.x})</>} denominator={2} />
                            <span className="ml-2">= {pointM.x}</span>
                        </MathDisplay>
                    </Formula>
                    <Formula explanation="חישוב שיעור Y">
                        <MathDisplay variable="Ym">
                             <Fraction numerator={<>{pointA.y} + ({pointB.y})</>} denominator={2} />
                            <span className="ml-2">= {pointM.y}</span>
                        </MathDisplay>
                    </Formula>
                </div>
            </div>
        </Section>
        
        <Section title="מציאת נקודת קצה">
            <p>לפעמים, במקום למצוא את נקודת האמצע, נצטרך למצוא את אחת מנקודות הקצה כשידועה לנו נקודת הקצה השנייה ונקודת האמצע.</p>
            <p>בעזרת שינוי נושא נוסחה פשוט, נוכל לבודד את שיעורי נקודת הקצה שאנו מחפשים (<span dir="ltr">x<sub>B</sub>, y<sub>B</sub></span>):</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Formula title="שיעור ה-X של נקודת הקצה">
                    <div dir="ltr" className="text-xl md:text-2xl font-medium">x<sub>B</sub> = 2 &middot; x<sub>M</sub> - x<sub>A</sub></div>
                </Formula>
                <Formula title="שיעור ה-Y של נקודת הקצה">
                     <div dir="ltr" className="text-xl md:text-2xl font-medium">y<sub>B</sub> = 2 &middot; y<sub>M</sub> - y<sub>A</sub></div>
                </Formula>
            </div>
            <Example title="דוגמה: מציאת נקודת קצה">
                <p>נתונה הנקודה <span dir="ltr">A(-1, 3)</span>. הנקודה <span dir="ltr">M(2, 5)</span> היא אמצע הקטע AB. מצאו את שיעורי הנקודה B.</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    <div className="space-y-4">
                        <div>
                            <p className="font-bold">חישוב Xb:</p>
                            <p dir="ltr" className="font-mono">Xb = 2 * Xm - Xa</p>
                            <p dir="ltr" className="font-mono">Xb = 2 * 2 - (-1) = 4 + 1 = 5</p>
                        </div>
                        <div>
                            <p className="font-bold">חישוב Yb:</p>
                            <p dir="ltr" className="font-mono">Yb = 2 * Ym - Ya</p>
                            <p dir="ltr" className="font-mono">Yb = 2 * 5 - 3 = 10 - 3 = 7</p>
                        </div>
                         <p className="font-bold mt-4">לכן, שיעורי הנקודה B הם (5,7).</p>
                    </div>
                     <div className="flex justify-center mt-4">
                        <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="w-full h-auto max-w-xs bg-white dark:bg-gray-800/50 rounded-lg shadow-inner border border-gray-200 dark:border-gray-700">
                            {gridLines}
                            <line x1={svgExA.x} y1={svgExA.y} x2={svgExB.x} y2={svgExB.y} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" />
                            <circle cx={svgExA.x} cy={svgExA.y} r="5" className={`${design.pointColors.A.fill}`} />
                            <circle cx={svgExM.x} cy={svgExM.y} r="5" className={`${design.pointColors.M.fill}`} />
                            <circle cx={svgExB.x} cy={svgExB.y} r="5" className={`${design.pointColors.B.fill}`} />
                            <text x={svgExA.x - 30} y={svgExA.y + 5} className="fill-current text-sm select-none pointer-events-none">A(-1,3)</text>
                            <text x={svgExM.x + 10} y={svgExM.y - 5} className="fill-current text-sm select-none pointer-events-none">M(2,5)</text>
                            <text x={svgExB.x + 10} y={svgExB.y + 5} className="fill-current text-sm select-none pointer-events-none">B(5,7)</text>
                        </svg>
                    </div>
                </div>
            </Example>
        </Section>
    </ContentPage>
  );
}

// --- NEW LEARNING CONTENT ---

const MathEquation = ({ children, explanation=null }) => (
    <div className="text-center my-4">
        <div dir="ltr" className="p-4 bg-gray-200 dark:bg-gray-700 rounded-md text-lg md:text-xl font-mono shadow-inner inline-block">
            {children}
        </div>
        {explanation && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{explanation}</p>}
    </div>
);

const EquationsWithVariableDenominatorContent = () => (
    <ContentPage title="משוואות עם נעלם במכנה" intro="בואו נלמד את השיטה לפתרון משוואות שבהן הנעלם (x) מופיע במכנה של שבר אחד או יותר.">
        <Section title="שלב 0: תחום הגדרה">
            <p>השלב הראשון והחשוב ביותר בפתרון משוואות כאלו הוא קביעת <b>תחום ההגדרה</b>. במתמטיקה, חילוק באפס הוא פעולה לא מוגדרת. לכן, עלינו לוודא שהמכנה של אף שבר במשוואה לא יהיה שווה לאפס.</p>
            <p>אנו עושים זאת על ידי בדיקת כל מכנה בנפרד, וקביעת הערכים של x שבעבורם המכנה מתאפס. ערכים אלו <b>אינם</b> יכולים להיות פתרון המשוואה.</p>
            <Example title="דוגמה למציאת תחום הגדרה">
                 <p>במשוואה הבאה:</p>
                 <MathEquation>
                    <Fraction numerator={5} denominator={'x - 2'} />
                    <span className="mx-2">=</span>
                    <Fraction numerator={10} denominator={'x + 3'} />
                 </MathEquation>
                 <p>יש שני מכנים:</p>
                 <ul className="list-disc pr-5 space-y-2">
                    <li><b>המכנה הראשון:</b> <span dir="ltr">x - 2</span>. הוא מתאפס כאשר <span dir="ltr">x - 2 = 0</span>, כלומר <span dir="ltr">x = 2</span>.</li>
                    <li><b>המכנה השני:</b> <span dir="ltr">x + 3</span>. הוא מתאפס כאשר <span dir="ltr">x + 3 = 0</span>, כלומר <span dir="ltr">x = -3</span>.</li>
                 </ul>
                 <p className="mt-2">לכן, תחום ההגדרה של המשוואה הוא <b dir="ltr">x &ne; 2</b> וגם <b dir="ltr">x &ne; -3</b>.</p>
            </Example>
        </Section>
        <Section title="שלבי הפתרון">
            <p>לאחר מציאת תחום ההגדרה, תהליך הפתרון כולל את השלבים הבאים:</p>
            <ol className="list-decimal list-inside space-y-3 font-semibold">
                <li>מוצאים את <b>המכנה המשותף</b> הקטן ביותר של כל השברים במשוואה.</li>
                <li><b>כופלים</b> כל איבר במשוואה במכנה המשותף שמצאנו. פעולה זו "מבטלת" את המכנים ומשאירה אותנו עם משוואה פשוטה יותר, ללא שברים.</li>
                <li><b>פותרים</b> את המשוואה החדשה שקיבלנו (בדרך כלל משוואה ממעלה ראשונה או שנייה).</li>
                <li><b>בודקים</b> את הפתרונות. יש לוודא שכל פתרון שקיבלנו נמצא בתחום ההגדרה. פתרון שאינו בתחום ההגדרה - נפסל.</li>
            </ol>
        </Section>
        <Section title="דוגמה 1: משוואה פשוטה">
            <Example title="פתרו את המשוואה">
                <MathEquation><Fraction numerator={10} denominator={'x'} /> - 3 = 4</MathEquation>
                <p><span className="font-bold">1. תחום הגדרה:</span> המכנה הוא x, לכן <b dir="ltr">x &ne; 0</b>.</p>
                <p><span className="font-bold">2. מכנה משותף:</span> המכנה המשותף הוא <b>x</b>.</p>
                <p><span className="font-bold">3. כפל במכנה משותף:</span> נכפול את כל המשוואה ב-x:</p>
                <MathEquation>x &middot; (<Fraction numerator={10} denominator={'x'} /> - 3) = x &middot; 4</MathEquation>
                <MathEquation>10 - 3x = 4x</MathEquation>
                <p><span className="font-bold">4. פתרון:</span> נעביר אגפים:</p>
                <MathEquation>10 = 7x <span className="mx-4">&rarr;</span> x = <Fraction numerator={10} denominator={7} /></MathEquation>
                <p><span className="font-bold">5. בדיקה:</span> הפתרון <span dir="ltr">x = 10/7</span> אינו 0, ולכן הוא תקין.</p>
            </Example>
        </Section>
        <Section title="דוגמה 2: פתרון שנפסל">
            <Example title="פתרו את המשוואה">
                <MathEquation><Fraction numerator={'2x'} denominator={'x - 5'} /> - <Fraction numerator={10} denominator={'x - 5'} /> = 3</MathEquation>
                <p><span className="font-bold">1. תחום הגדרה:</span> המכנה הוא x-5, לכן <b dir="ltr">x &ne; 5</b>.</p>
                <p><span className="font-bold">2. מכנה משותף:</span> המכנה המשותף הוא <b>x - 5</b>.</p>
                <p><span className="font-bold">3. כפל ופישוט:</span> מכיוון שיש מכנה זהה, ניתן לחבר את המונים תחילה:</p>
                <MathEquation><Fraction numerator={'2x - 10'} denominator={'x - 5'} /> = 3</MathEquation>
                <MathEquation><Fraction numerator={'2(x - 5)'} denominator={'x - 5'} /> = 3</MathEquation>
                <p>כעת ניתן לצמצם (בהנחה ש-x לא שווה 5):</p>
                <MathEquation>2 = 3</MathEquation>
                <p>קיבלנו "פסוק שקר" (2 לא שווה 3), מה שאומר שלמשוואה אין פתרון. <br/> דרך אחרת היא לכפול במכנה המשותף:</p>
                <MathEquation>{'(x-5)'} &middot; <Fraction numerator={'2x - 10'} denominator={'x - 5'} /> = 3 &middot; {'(x-5)'}</MathEquation>
                <MathEquation>2x - 10 = 3x - 15</MathEquation>
                <p><span className="font-bold">4. פתרון:</span></p>
                <MathEquation>5 = x</MathEquation>
                <ImportantNote>
                    <b>שימו לב!</b> קיבלנו פתרון <b dir="ltr">x = 5</b>.
                </ImportantNote>
                <p><span className="font-bold">5. בדיקה:</span> בתחילת הדרך קבענו שתחום ההגדרה הוא <b dir="ltr">x &ne; 5</b>. מכיוון שהפתרון היחיד שקיבלנו נפסל על ידי תחום ההגדרה, למשוואה <b>אין פתרון</b>.</p>
            </Example>
        </Section>
    </ContentPage>
);


const CoordinateSystemContent = () => (
    <ContentPage title="מבוא - מערכת צירים" intro="בואו נלמד על מערכת הצירים ואיך למקם נקודות על המישור.">
        <Section title="מערכת הצירים">
            <p>מערכת צירים מורכבת משני צירים מאונכים זה לזה. הציר האופקי נקרא ציר ה-X והציר האנכי נקרא ציר ה-Y. מערכת הצירים מחלקת את המישור ל-4 רביעים, הממוספרים נגד כיוון השעון.</p>
            <div className="flex justify-center">
                 <svg viewBox="0 0 200 200" className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                    {/* Axes */}
                    <path d="M 10 100 L 190 100" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
                    <path d="M 100 190 L 100 10" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
                    <text x="185" y="115" fontSize="12" fill="currentColor">x</text>
                    <text x="85" y="15" fontSize="12" fill="currentColor">y</text>
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                        </marker>
                    </defs>
                    {/* Quadrant Labels */}
                    <text x="140" y="60" fontSize="14" fontWeight="bold" fill="currentColor" textAnchor="middle">רביע ראשון</text>
                    <text x="60" y="60" fontSize="14" fontWeight="bold" fill="currentColor" textAnchor="middle">רביע שני</text>
                    <text x="60" y="140" fontSize="14" fontWeight="bold" fill="currentColor" textAnchor="middle">רביע שלישי</text>
                    <text x="140" y="140" fontSize="14" fontWeight="bold" fill="currentColor" textAnchor="middle">רביע רביעי</text>
                </svg>
            </div>
        </Section>
        <Section title="שיעורי נקודה">
            <p>כל נקודה במישור מסומנת על ידי זוג סדור של שני מספרים (x, y). המספר השמאלי הוא שיעור ה-x של הנקודה, והמספר הימני הוא שיעור ה-y של הנקודה.</p>
            <Example title="דוגמה">
                <p>לנקודה (5,6): שיעור ה-x הוא 5 ושיעור ה-y הוא 6.</p>
            </Example>
            <ImportantNote>
                שיעור ה-x של כל הנקודות על ציר ה-y שווה ל-0.
                <br/>
                שיעור ה-y של כל הנקודות על ציר ה-x שווה ל-0.
            </ImportantNote>
        </Section>
    </ContentPage>
);

const StraightLineContent = () => (
    <ContentPage title="הקו הישר" intro="נכיר את משוואת הישר ונבין את המשמעות של השיפוע והפרמטרים הנוספים.">
        <Section title="המשוואה המפורשת של הישר">
            <p>הצורה הכללית של משוואה מפורשת של קו ישר היא <span dir="ltr" className="font-bold text-lg">y = mx + b</span>. במשוואה זו שני פרמטרים קבועים:</p>
            <ul className="list-disc pr-5 space-y-2">
                <li><b className="text-indigo-400">m (השיפוע)</b>: קובע את זווית הנטייה של הישר.</li>
                <li><b className="text-teal-400">b (הפרמטר החופשי)</b>: קובע את נקודת החיתוך של הישר עם ציר ה-y.</li>
            </ul>
        </Section>
        <Section title="משמעות השיפוע m">
            <p>השיפוע m מראה את היחס בין השינוי האנכי (ב-y) לשינוי האופקי (ב-x) לאורך הישר.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <StaticGraph title="כאשר m > 0 (חיובי), הישר עולה.">
                    <GraphLine m={1} b={1} range={5} width={250} height={250} />
                </StaticGraph>
                 <StaticGraph title="כאשר m < 0 (שלילי), הישר יורד.">
                    <GraphLine m={-1} b={1} range={5} width={250} height={250} />
                </StaticGraph>
                <StaticGraph title="כאשר m = 0, הישר מקביל לציר ה-x.">
                    <GraphLine m={0} b={2} range={5} width={250} height={250} />
                </StaticGraph>
                <StaticGraph title="לישר המקביל לציר ה-y אין שיפוע מוגדר. משוואתו היא מהצורה x=k.">
                     <GraphVLine x={3} range={5} width={250} height={250} />
                </StaticGraph>
            </div>
        </Section>
         <Section title="משמעות הפרמטר b">
            <p>הפרמטר b מייצג את שיעור ה-y של נקודת החיתוך של הישר עם ציר ה-y. כלומר, הישר חותך את ציר ה-y בנקודה <span dir="ltr">(0, b)</span>.</p>
             <div className="flex justify-center">
                <StaticGraph title="הישר y=mx+b חותך את ציר ה-y בנקודה (0,b)">
                    <GraphLine m={-0.75} b={2} range={5} width={250} height={250} />
                    <circle cx="125" cy="125" r="3" fill="currentColor" />
                    <text x="130" y="120" fontSize="12" fill="currentColor">(0,b)</text>
                </StaticGraph>
            </div>
        </Section>
        <Section title="מציאת שיפוע על פי 2 נקודות">
            <p>כאשר נתונות שתי נקודות על ישר, <span dir="ltr">A(x<sub>1</sub>, y<sub>1</sub>)</span> ו-<span dir="ltr">B(x<sub>2</sub>, y<sub>2</sub>)</span>, ניתן לחשב את השיפוע שלו.</p>
            <Formula title="נוסחת שיפוע לפי 2 נקודות">
                <div className="flex items-center justify-center gap-2 text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-100">
                    <span>m =</span>
                    <Fraction numerator={<><span dir="ltr">y<sub>2</sub></span> - <span dir="ltr">y<sub>1</sub></span></>} denominator={<><span dir="ltr">x<sub>2</sub></span> - <span dir="ltr">x<sub>1</sub></span></>} />
                </div>
            </Formula>
            <Example title="דוגמה">
                <p>חשבו את השיפוע של ישר העובר דרך הנקודות (2,3) ו-(6,11).</p>
                <p dir="ltr" className="font-mono">m = (11 - 3) / (6 - 2) = 8 / 4 = 2</p>
                <p>השיפוע של הישר הוא 2.</p>
            </Example>
        </Section>
        <Section title="מציאת משוואת ישר על פי שיפוע ונקודה">
            <p>כאשר נתונים שיפוע (m) ונקודה <span dir="ltr">(x<sub>1</sub>, y<sub>1</sub>)</span> שנמצאת על הישר, ניתן למצוא את משוואת הישר.</p>
            <Formula title="נוסחה למציאת משוואת ישר">
                <div className="text-xl md:text-2xl font-medium" dir="ltr">
                    y - y<sub>1</sub> = m(x - x<sub>1</sub>)
                </div>
            </Formula>
             <Example title="דוגמה">
                <p>מצאו את משוואת הישר ששיפועו 3 ועובר דרך הנקודה (1,5).</p>
                <p>נציב בנוסחה: <span dir="ltr" className="font-mono">y - 5 = 3(x - 1)</span></p>
                <p>נפשט: <span dir="ltr" className="font-mono">y - 5 = 3x - 3</span></p>
                <p>ולבסוף: <span dir="ltr" className="font-mono font-bold">y = 3x + 2</span></p>
            </Example>
        </Section>
    </ContentPage>
);

const IntersectionContent = () => (
    <ContentPage title="חיתוך בין ישרים ועם הצירים" intro="נלמד כיצד למצוא נקודות חיתוך של ישר עם הצירים ונקודות חיתוך בין שני ישרים.">
        <Section title="נקודות חיתוך של ישר עם הצירים">
            <p>כדי למצוא את נקודות החיתוך של ישר עם הצירים, אנו משתמשים בעובדה שעל הצירים, אחד השיעורים הוא תמיד אפס.</p>
            <div className="space-y-4">
                <Formula explanation="כדי למצוא את נקודת החיתוך עם ציר ה-y, נציב x=0 במשוואת הישר.">
                    <p className="text-xl font-bold">חיתוך עם ציר y  &larr;  x=0</p>
                </Formula>
                <Formula explanation="כדי למצוא את נקודת החיתוך עם ציר ה-x, נציב y=0 במשוואת הישר.">
                    <p className="text-xl font-bold">חיתוך עם ציר x  &larr;  y=0</p>
                </Formula>
            </div>
        </Section>
        <Section title="מצב הדדי בין שני ישרים">
             <p>כאשר נתונים שני ישרים, ישנן שלוש אפשרויות למצב ההדדי ביניהם:</p>
            <div className="space-y-4">
                <div>
                    <h4 className="font-bold text-lg">א. ישרים נחתכים</h4>
                    <p>הישרים נחתכים בנקודה אחת בדיוק. זה קורה כאשר השיפועים שלהם שונים (<span dir="ltr">m<sub>1</sub> &ne; m<sub>2</sub></span>).</p>
                </div>
                 <div>
                    <h4 className="font-bold text-lg">ב. ישרים מקבילים</h4>
                    <p>לישרים אין נקודת חיתוך. זה קורה כאשר השיפועים שלהם שווים (<span dir="ltr">m<sub>1</sub> = m<sub>2</sub></span>), אך הם חותכים את ציר ה-y במקומות שונים (<span dir="ltr">b<sub>1</sub> &ne; b<sub>2</sub></span>).</p>
                </div>
                 <div>
                    <h4 className="font-bold text-lg">ג. ישרים מתלכדים</h4>
                    <p>לישרים יש אינסוף נקודות חיתוך (זה אותו ישר). זה קורה כאשר גם השיפועים וגם נקודות החיתוך עם ציר y שוות (<span dir="ltr">m<sub>1</sub> = m<sub>2</sub></span>, <span dir="ltr">b<sub>1</sub> = b<sub>2</sub></span>).</p>
                </div>
            </div>
        </Section>
        <Section title="מציאת נקודת חיתוך בין שני ישרים">
            <p>כדי למצוא את נקודת החיתוך, יש לפתור את מערכת המשוואות של שני הישרים. הפתרון (זוג ה-x וה-y) הוא שיעורי נקודת החיתוך.</p>
            <Example title="דוגמה" isHebrew={false}>
                <p className="text-right">מצאו את המצב ההדדי בין שני הישרים הבאים:</p>
                <div className="p-4 bg-gray-200 dark:bg-gray-800 rounded text-center font-mono text-lg">
                    <p>2x + y = 9</p>
                    <p>x - 2y = -8</p>
                </div>
                <p className="font-bold mt-4 text-right">פתרון:</p>
                <ol className="list-decimal list-inside text-right space-y-2">
                    <li>נרשום כל ישר במשוואה מפורשת (y=mx+b) כדי להשוות שיפועים.
                        <ul className="list-disc pr-6 font-mono">
                            <li>y = -2x + 9</li>
                            <li>x + 8 = 2y  &rArr;  y = 0.5x + 4</li>
                        </ul>
                    </li>
                    <li>השיפועים שונים (2- ו-0.5), לכן הישרים נחתכים.</li>
                    <li>כדי למצוא את נקודת החיתוך, נשווה בין המשוואות:
                        <p className="font-mono text-center">-2x + 9 = 0.5x + 4</p>
                        <p className="font-mono text-center">5 = 2.5x</p>
                        <p className="font-mono text-center">x = 2</p>
                    </li>
                    <li>נציב x=2 באחת המשוואות כדי למצוא את y:
                        <p className="font-mono text-center">y = -2(2) + 9 = -4 + 9 = 5</p>
                    </li>
                    <li>הישרים נחתכים בנקודה (2,5).</li>
                </ol>
            </Example>
        </Section>
    </ContentPage>
);

const PerpendicularLinesContent = () => (
    <ContentPage title="ישרים מאונכים" intro="נלמד את התנאי המיוחד שמתקיים בין שיפועים של ישרים שמאונכים זה לזה.">
        <Section title="התנאי למאונכות">
            <p>שני ישרים (שאינם מקבילים לצירים) מאונכים זה לזה אם ורק אם מכפלת השיפועים שלהם היא 1-.</p>
            <Formula title="תנאי ניצבות">
                <div className="text-xl md:text-2xl font-medium" dir="ltr">
                    m<sub>1</sub> &middot; m<sub>2</sub> = -1
                </div>
            </Formula>
            <p>במילים אחרות, שיפוע של ישר אחד הוא הופכי ונגדי לשני. לדוגמה, אם שיפוע של ישר הוא 2, שיפוע הישר המאונך לו יהיה <span dir="ltr">-1/2</span>.</p>
        </Section>
        <Section title="דוגמה למציאת ישר מאונך">
            <Example title="דוגמה">
                <p>מצאו את משוואת הישר העובר דרך הנקודה (6,1) ומאונך לישר <span dir="ltr">y = 3x - 5</span>.</p>
                <ol className="list-decimal list-inside space-y-2">
                    <li>שיפוע הישר הנתון הוא 3.</li>
                    <li>נמצא את שיפוע הישר המאונך (הופכי ונגדי): <span dir="ltr" className="font-mono">m = -1/3</span>.</li>
                    <li>נשתמש בנוסחה למציאת משוואת ישר עם שיפוע ונקודה (6,1):
                        <p dir="ltr" className="font-mono">y - 1 = (-1/3)(x - 6)</p>
                        <p dir="ltr" className="font-mono">y - 1 = -1/3x + 2</p>
                        <p dir="ltr" className="font-mono font-bold">y = -1/3x + 3</p>
                    </li>
                </ol>
            </Example>
            <div className="flex justify-center mt-4">
                <StaticGraph title="הישרים y=3x-5 ו- y=-1/3x+3 מאונכים זה לזה.">
                    <GraphLine m={3} b={-5} range={8} width={250} height={250} color="stroke-blue-500" />
                    <GraphLine m={-1/3} b={3} range={8} width={250} height={250} color="stroke-red-500" />
                    <circle cx="154.6875" cy="115.3125" r="3" fill="currentColor" />
                </StaticGraph>
            </div>
        </Section>
    </ContentPage>
);

const DistanceContent = () => (
    <ContentPage title="מרחק בין שתי נקודות" intro="נלמד כיצד לחשב את המרחק בין שתי נקודות (או את אורך הקטע המחבר ביניהן) באמצעות נוסחה.">
        <Section title="נוסחת המרחק">
            <p>המרחק d בין שתי נקודות <span dir="ltr">A(x<sub>1</sub>, y<sub>1</sub>)</span> ו-<span dir="ltr">B(x<sub>2</sub>, y<sub>2</sub>)</span> מחושב על פי משפט פיתגורס.</p>
            <Formula title="נוסחת מרחק">
                <div className="text-lg md:text-xl font-medium" dir="ltr">
                    d = &radic;[ (x<sub>2</sub> - x<sub>1</sub>)<sup>2</sup> + (y<sub>2</sub> - y<sub>1</sub>)<sup>2</sup> ]
                </div>
            </Formula>
            <div className="flex justify-center mt-4">
                <StaticGraph title="המרחק הוא היתר במשולש ישר זווית שהניצבים שלו הם ההפרשים ב-x וב-y." range={10}>
                    <line x1="50" y1="175" x2="200" y2="75" stroke="currentColor" strokeWidth="2" />
                    <line x1="50" y1="175" x2="200" y2="175" stroke="currentColor" strokeDasharray="4" />
                    <line x1="200" y1="175" x2="200" y2="75" stroke="currentColor" strokeDasharray="4" />
                    <circle cx="50" cy="175" r="3" fill="currentColor" />
                    <circle cx="200" cy="75" r="3" fill="currentColor" />
                    <text x="35" y="180" fontSize="10" fill="currentColor">(x₁,y₁)</text>
                    <text x="205" y="75" fontSize="10" fill="currentColor">(x₂,y₂)</text>
                    <text x="125" y="190" fontSize="10" fill="currentColor">|x₂-x₁|</text>
                    <text x="215" y="125" fontSize="10" fill="currentColor">|y₂-y₁|</text>
                    <text x="115" y="120" fontSize="12" fill="currentColor" fontWeight="bold">d</text>
                </StaticGraph>
            </div>
        </Section>
        <Section title="דוגמה לחישוב מרחק">
            <Example title="דוגמה">
                <p>מצאו את המרחק בין הנקודות (1,2) ו-(5,5).</p>
                <p dir="ltr" className="font-mono">d = &radic;[ (5 - 1)² + (5 - 2)² ]</p>
                <p dir="ltr" className="font-mono">d = &radic;[ 4² + 3² ]</p>
                <p dir="ltr" className="font-mono">d = &radic;[ 16 + 9 ] = &radic;25 = 5</p>
                <p>המרחק בין הנקודות הוא 5.</p>
            </Example>
        </Section>
    </ContentPage>
);


const TrianglePropertiesContent = () => (
    <ContentPage title="תכונות משולש" intro="נחקור תכונות גאומטריות של משולשים כמו תיכון, גובה ואנך אמצעי, ונלמד איך לחשב אותן במערכת הצירים.">
        <Section title="תיכון במשולש (Median)">
            <p>תיכון במשולש הוא קטע המחבר קודקוד עם אמצע הצלע שמולו.</p>
            <p>שלבי מציאת משוואת תיכון:</p>
            <ol className="list-decimal list-inside space-y-2">
                <li>מוצאים את שיעורי נקודת האמצע של הצלע שמול הקודקוד (בעזרת נוסחת אמצע קטע).</li>
                <li>מוצאים את משוואת הישר העובר דרך הקודקוד ונקודת האמצע (בעזרת נוסחת ישר על פי 2 נקודות).</li>
            </ol>
             <div className="flex justify-center mt-4">
                <StaticGraph title="הקטע AD הוא תיכון לצלע BC" range={6}>
                    {/* Triangle Vertices */}
                    <path d="M 145.83 187.5 L 41.66 145.83 L 166.66 41.66 Z" fill="rgba(79,70,229,0.1)" stroke="#4F46E5" strokeWidth="1" />
                     {/* Median */}
                    <line x1="145.83" y1="187.5" x2="104.16" y2="93.75" stroke="#D946EF" strokeWidth="2" />
                    {/* Labels */}
                    <text x="140" y="200" fontSize="10" fill="currentColor">A</text>
                    <text x="30" y="150" fontSize="10" fill="currentColor">B</text>
                    <text x="170" y="40" fontSize="10" fill="currentColor">C</text>
                    <text x="95" y="85" fontSize="10" fill="currentColor">D</text>
                </StaticGraph>
            </div>
        </Section>
        <Section title="גובה במשולש (Altitude)">
            <p>גובה במשולש הוא קטע היוצא מקודקוד ומאונך לצלע שמולו (או להמשכה).</p>
            <p>שלבי מציאת משוואת גובה:</p>
            <ol className="list-decimal list-inside space-y-2">
                <li>מוצאים את שיפוע הצלע אליה יורד הגובה.</li>
                <li>מוצאים את השיפוע המאונך לה (הופכי ונגדי).</li>
                <li>מוצאים את משוואת הישר (הגובה) על פי השיפוע המאונך והקודקוד שממנו הוא יוצא.</li>
            </ol>
             <div className="flex justify-center mt-4">
                <StaticGraph title="הקטע AH הוא גובה לצלע BC" range={6}>
                     <path d="M 145.83 187.5 L 41.66 145.83 L 166.66 41.66 Z" fill="rgba(79,70,229,0.1)" stroke="#4F46E5" strokeWidth="1" />
                    <line x1="145.83" y1="187.5" x2="119.58" y2="78.33" stroke="#D946EF" strokeWidth="2" />
                    <text x="140" y="200" fontSize="10" fill="currentColor">A</text>
                    <text x="30" y="150" fontSize="10" fill="currentColor">B</text>
                    <text x="170" y="40" fontSize="10" fill="currentColor">C</text>
                    <text x="110" y="70" fontSize="10" fill="currentColor">H</text>
                </StaticGraph>
            </div>
        </Section>
         <Section title="אנך אמצעי (Perpendicular Bisector)">
            <p>אנך אמצעי לקטע הוא ישר המאונך לקטע בדיוק בנקודת האמצע שלו.</p>
            <p>שלבי מציאת משוואת אנך אמצעי:</p>
            <ol className="list-decimal list-inside space-y-2">
                <li>מוצאים את שיפוע הקטע.</li>
                <li>מוצאים את השיפוע המאונך לו (הופכי ונגדי).</li>
                <li>מוצאים את נקודת האמצע של הקטע.</li>
                <li>מוצאים את משוואת הישר על פי השיפוע המאונך ונקודת האמצע.</li>
            </ol>
             <div className="flex justify-center mt-4">
                <StaticGraph title="ישר L הוא אנך אמצעי לקטע AB" range={6}>
                    <line x1="62.5" y1="166.66" x2="166.66" y2="83.33" stroke="#4F46E5" strokeWidth="2" />
                    <line x1="83.33" y1="62.5" x2="187.5" y2="187.5" stroke="#D946EF" strokeWidth="2" />
                    <text x="50" y="170" fontSize="10" fill="currentColor">A</text>
                    <text x="170" y="80" fontSize="10" fill="currentColor">B</text>
                    <text x="190" y="190" fontSize="10" fill="currentColor">L</text>
                </StaticGraph>
            </div>
        </Section>
    </ContentPage>
);

// --- MAIN COMPONENT ---
export default function LearnSection() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const groupedSubjects = useMemo(() => {
    return Object.values(SUBJECTS).reduce((acc, subject) => {
        const category = subject.category || 'כללי';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(subject);
        return acc;
    }, {} as Record<string, Subject[]>);
  }, []);

  const renderContent = () => {
    if (!selectedSubject) return null;
    switch(selectedSubject.id) {
        case SUBJECTS.MIDPOINT.id:
            return <MidpointLearnContent />;
        case SUBJECTS.COORDINATE_SYSTEM.id:
            return <CoordinateSystemContent />;
        case SUBJECTS.STRAIGHT_LINE.id:
            return <StraightLineContent />;
        case SUBJECTS.LINE_INTERSECTION.id:
            return <IntersectionContent />;
        case SUBJECTS.PERPENDICULAR_LINES.id:
            return <PerpendicularLinesContent />;
        case SUBJECTS.DISTANCE.id:
            return <DistanceContent />;
        case SUBJECTS.TRIANGLE_PROPERTIES.id:
            return <TrianglePropertiesContent />;
        case SUBJECTS.EQUATIONS_WITH_VARIABLE_DENOMINATOR.id:
            return <EquationsWithVariableDenominatorContent />;
        default:
            return (
                <div className={design.layout.card}>
                    <h2 className={design.typography.sectionTitle}>{selectedSubject.name}</h2>
                    <p className={`text-xl ${design.colors.text.muted.light} dark:${design.colors.text.muted.dark}`}>התוכן עבור נושא זה יתווסף בקרוב!</p>
                </div>
            );
    }
  }

  if (!selectedSubject) {
    return (
      <div className={design.layout.standard}>
        <h2 className={design.typography.pageTitle}>מרכז למידה</h2>
        <p className={`text-lg ${design.colors.text.muted.light} dark:${design.colors.text.muted.dark} text-center mb-10`}>
          בחר/י נושא כדי להתחיל ללמוד.
        </p>
        {Object.entries(groupedSubjects).map(([category, subjects]) => (
            <div key={category} className="mb-12">
                <h3 className="text-2xl font-bold mb-4 text-right border-b-2 border-indigo-400 pb-2">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(subjects as Subject[]).map((subject: Subject) => (
                    <div
                    key={subject.id}
                    onClick={() => subject.enabled && setSelectedSubject(subject)}
                    className={subject.enabled ? design.learn.subjectSelector.enabled : design.learn.subjectSelector.disabled}
                    >
                    <h3 className={design.typography.cardTitle}>{subject.name}</h3>
                    {!subject.enabled && (
                        <span className={`mt-2 inline-block bg-yellow-400 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                        בקרוב!
                        </span>
                    )}
                    </div>
                ))}
                </div>
            </div>
        ))}
      </div>
    );
  }


  return (
    <div>
      <button 
        onClick={() => setSelectedSubject(null)}
        className={`mb-6 inline-flex items-center ${design.components.button.base.replace('py-3', 'py-2')} ${design.components.button.secondary}`}
      >
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        חזרה לבחירת נושא
      </button>
      {renderContent()}
    </div>
  );
}