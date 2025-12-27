
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SUBJECTS, Subject, Point } from '../types.ts';
import { design } from '../constants/design_system.ts';

// --- MATH RENDERER (Reused from PracticeEngine) ---
const MathRenderer: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
    const parts = text.split(/(\^[a-zA-Z0-9]+)/g);
    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part.startsWith('^')) {
                    return <sup key={i} className="text-[0.75em] font-bold ml-0.5 leading-none">{part.substring(1)}</sup>;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

// --- SHARED LEARNING COMPONENTS ---
const ContentPage = ({ title, intro = null, children }: { title: any; intro?: any; children?: React.ReactNode }) => (
    <div className={design.learn.contentPage}>
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">{title}</h2>
      {intro && <p className={`text-lg ${design.colors.text.muted.light} dark:${design.colors.text.muted.dark} text-center mb-10`}>{intro}</p>}
      <div className="space-y-12">{children}</div>
    </div>
);

const Section = ({ title, children }: { title: any; children?: React.ReactNode }) => (
    <div>
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <div className={design.learn.section}>{children}</div>
    </div>
);

const Example = ({ title, children, isHebrew = true }: { title: any; children?: React.ReactNode; isHebrew?: boolean }) => (
    <div className={`${design.learn.example} ${isHebrew ? 'text-right' : 'text-left'}`}>
        <h4 className="font-bold text-teal-800 dark:text-teal-200 text-lg mb-3">{title}</h4>
        <div className="space-y-2">{children}</div>
    </div>
);

const Formula = ({ title = null, children, explanation = null }: { title?: any; children?: React.ReactNode; explanation?: any }) => (
     <div className={design.learn.formula}>
        {title && <h3 className="text-xl font-semibold text-indigo-800 dark:text-indigo-200">{title}</h3>}
        <div dir="ltr" className="my-4 p-4 bg-white dark:bg-gray-800 rounded-md text-center shadow-inner min-h-[60px] flex items-center justify-center">
            {children}
        </div>
        {explanation && <p className="text-indigo-700 dark:text-indigo-300">{explanation}</p>}
    </div>
);

const ImportantNote = ({ children }: { children?: React.ReactNode }) => (
    <div className={design.learn.importantNote}>
        <p><span className="font-bold">הערה חשובה:</span> {children}</p>
    </div>
);

const Fraction = ({ numerator, denominator }) => (
    <div className="inline-flex flex-col items-center align-middle mx-2">
        <span className="px-2">{numerator}</span>
        <hr className="w-full border-t-2 border-gray-700 dark:border-gray-200 my-1" />
        <span className="px-2">{denominator}</span>
    </div>
);

// --- INTERACTIVE GRAPHICAL COMPONENTS ---

const MiniGrid: React.FC<{ children?: React.ReactNode; viewBox?: string }> = ({ children, viewBox = "0 0 200 200" }) => (
    <svg viewBox={viewBox} className="w-full max-w-[300px] mx-auto bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-visible">
        {/* Grid Lines */}
        <line x1="100" y1="0" x2="100" y2="200" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" />
        <line x1="0" y1="100" x2="200" y2="100" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" />
        {children}
    }
    </svg>
);

const QuadrantExplorer = () => {
    const [hovered, setHovered] = useState<number | null>(null);
    const quadrants = [
        { id: 1, name: "ראשון", signs: "(+,+)", x: 100, y: 0 },
        { id: 2, name: "שני", signs: "(-,+)", x: 0, y: 0 },
        { id: 3, name: "שלישי", signs: "(-,-)", x: 0, y: 100 },
        { id: 4, name: "רביעי", signs: "(+,-)", x: 100, y: 100 }
    ];

    return (
        <div className="flex flex-col md:flex-row items-center gap-8 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border-2 border-indigo-200">
            <div className="w-full max-w-[250px]">
                <MiniGrid>
                    {quadrants.map(q => (
                        <rect 
                            key={q.id}
                            x={q.x} y={q.y} width="100" height="100" 
                            className={`transition-colors cursor-help ${hovered === q.id ? 'fill-indigo-500/30' : 'fill-transparent'}`}
                            onMouseEnter={() => setHovered(q.id)}
                            onMouseLeave={() => setHovered(null)}
                        />
                    ))}
                    <text x="150" y="50" className="fill-gray-400 font-bold text-xs" textAnchor="middle">I</text>
                    <text x="50" y="50" className="fill-gray-400 font-bold text-xs" textAnchor="middle">II</text>
                    <text x="50" y="150" className="fill-gray-400 font-bold text-xs" textAnchor="middle">III</text>
                    <text x="150" y="150" className="fill-gray-400 font-bold text-xs" textAnchor="middle">IV</text>
                </MiniGrid>
            </div>
            <div className="flex-grow text-center md:text-right">
                <h4 className="font-bold text-xl mb-4 text-indigo-800 dark:text-indigo-200">חוקר רביעים</h4>
                {hovered ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <p className="text-2xl font-bold text-indigo-600 mb-2">רביע {quadrants[hovered-1].name}</p>
                        <p className="text-xl font-mono" dir="ltr">{quadrants[hovered-1].signs}</p>
                    </div>
                ) : (
                    <p className="text-gray-500 italic">העבירו את העכבר על הגרף כדי לחקור...</p>
                )}
            </div>
        </div>
    );
};

const InteractivePointTool = () => {
    const [p1, setP1] = useState<Point>({ x: 20, y: 40 });
    const [p2, setP2] = useState<Point>({ x: 160, y: 140 });
    const svgRef = useRef<SVGSVGElement>(null);

    const handleMove = (e: React.MouseEvent | React.TouchEvent, pointIdx: number) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const x = Math.round((clientX - rect.left) / rect.width * 200);
        const y = Math.round((clientY - rect.top) / rect.height * 200);
        
        if (pointIdx === 1) setP1({ x, y });
        else setP2({ x, y });
    };

    // Math coords (centered 0,0)
    const m1 = { x: (p1.x - 100) / 10, y: (100 - p1.y) / 10 };
    const m2 = { x: (p2.x - 100) / 10, y: (100 - p2.y) / 10 };
    
    const dx = m2.x - m1.x;
    const dy = m2.y - m1.y;
    const slope = dx !== 0 ? dy / dx : Infinity;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const mid = { x: (m1.x + m2.x) / 2, y: (m1.y + m2.y) / 2 };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
             <h4 className="font-bold text-lg mb-4 text-center">כלי חקירה: שיפוע, מרחק ואמצע קטע</h4>
             <div className="flex flex-col lg:flex-row items-center gap-8">
                <svg 
                    ref={svgRef} 
                    viewBox="0 0 200 200" 
                    className="w-full max-w-[300px] aspect-square bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 touch-none"
                    onMouseMove={(e) => {
                        if (e.buttons === 1) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = (e.clientX - rect.left) / rect.width * 200;
                            const y = (e.clientY - rect.top) / rect.height * 200;
                            const d1 = Math.hypot(x - p1.x, y - p1.y);
                            const d2 = Math.hypot(x - p2.x, y - p2.y);
                            handleMove(e, d1 < d2 ? 1 : 2);
                        }
                    }}
                >
                    <line x1="100" y1="0" x2="100" y2="200" stroke="#ddd" strokeWidth="1" />
                    <line x1="0" y1="100" x2="200" y2="100" stroke="#ddd" strokeWidth="1" />
                    
                    {/* The Line */}
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#6366f1" strokeWidth="3" />
                    
                    {/* Triangle for distance visualization */}
                    <path d={`M${p1.x},${p1.y} L${p2.x},${p1.y} L${p2.x},${p2.y}`} fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 2" className="opacity-40" />
                    
                    {/* Points */}
                    <circle cx={p1.x} cy={p1.y} r="8" className="fill-blue-500 cursor-move" />
                    <circle cx={p2.x} cy={p2.y} r="8" className="fill-orange-500 cursor-move" />
                    
                    {/* Midpoint */}
                    <circle cx={(p1.x+p2.x)/2} cy={(p1.y+p2.y)/2} r="5" className="fill-pink-500" />
                    
                    <text x={p1.x + 10} y={p1.y - 10} className="text-[10px] fill-blue-600 font-bold" textAnchor="start">A</text>
                    <text x={p2.x + 10} y={p2.y - 10} className="text-[10px] fill-orange-600 font-bold" textAnchor="start">B</text>
                </svg>

                <div className="flex-grow w-full space-y-4 font-mono text-sm" dir="ltr">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-r-4 border-blue-500">
                        <p className="font-bold mb-1">Point A ({m1.x.toFixed(1)}, {m1.y.toFixed(1)})</p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-r-4 border-orange-500">
                        <p className="font-bold mb-1">Point B ({m2.x.toFixed(1)}, {m2.y.toFixed(1)})</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 text-center">
                            <p className="text-xs text-indigo-400">SLOPE (m)</p>
                            <p className="font-bold text-indigo-700">{slope === Infinity ? '∞' : slope.toFixed(2)}</p>
                        </div>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 text-center">
                            <p className="text-xs text-indigo-400">DISTANCE (d)</p>
                            <p className="font-bold text-indigo-700">{distance.toFixed(2)}</p>
                        </div>
                        <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded border border-pink-200 text-center">
                            <p className="text-xs text-pink-400">MIDPOINT (M)</p>
                            <p className="font-bold text-pink-700">({mid.x.toFixed(1)}, {mid.y.toFixed(1)})</p>
                        </div>
                    </div>
                </div>
             </div>
             <p className="mt-4 text-xs text-center text-gray-400">גררו את הנקודות הצבעוניות כדי לראות את הערכים משתנים</p>
        </div>
    );
};

const DerivativeVisualizer = () => {
    const [x, setX] = useState(0);
    const a = 0.5; // f(x) = 0.5x^2

    // Function to get SVG coords from math coords (0,0 is center 150,150)
    // Scale: 1 math unit = 20 svg units
    const toSvg = (mx: number, my: number) => ({ x: 150 + mx * 20, y: 150 - my * 20 });
    
    const fx = (val: number) => a * val * val;
    const fpx = (val: number) => 2 * a * val; // derivative 2ax

    const points = [];
    for (let i = -6; i <= 6; i += 0.1) {
        const { x: sx, y: sy } = toSvg(i, fx(i));
        points.push(`${sx},${sy}`);
    }

    const currentP = toSvg(x, fx(x));
    const currentM = fpx(x);
    
    // Tangent line equation: y - y0 = m(x - x0) => y = m(x-x0) + y0
    const tP1 = toSvg(x - 2, currentM * (-2) + fx(x));
    const tP2 = toSvg(x + 2, currentM * (2) + fx(x));

    return (
        <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-2xl border-2 border-teal-200">
            <h4 className="font-bold text-xl mb-4 text-center text-teal-800 dark:text-teal-200">המחשת נגזרת ומשיק</h4>
            <div className="flex flex-col md:flex-row items-center gap-8">
                <svg viewBox="0 0 300 300" className="w-full max-w-[300px] bg-white dark:bg-gray-800 border rounded-xl">
                    <line x1="150" y1="0" x2="150" y2="300" stroke="#eee" />
                    <line x1="0" y1="150" x2="300" y2="150" stroke="#eee" />
                    
                    {/* Parabola */}
                    <polyline points={points.join(' ')} fill="none" stroke="#2dd4bf" strokeWidth="2" />
                    
                    {/* Tangent Line */}
                    <line x1={tP1.x} y1={tP1.y} x2={tP2.x} y2={tP2.y} stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 2" />
                    
                    {/* The Point */}
                    <circle cx={currentP.x} cy={currentP.y} r="5" className="fill-teal-600" />
                </svg>

                <div className="flex-grow space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400">הזיזו את הנקודה (x): {x.toFixed(1)}</label>
                        <input 
                            type="range" min="-5" max="5" step="0.1" value={x} 
                            onChange={(e) => setX(parseFloat(e.target.value))}
                            className="w-full accent-teal-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-teal-100">
                            <p className="text-xs uppercase font-bold text-gray-400">ערך הפונקציה</p>
                            <p className="text-lg font-mono" dir="ltr">f(x) = {fx(x).toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-rose-100">
                            <p className="text-xs uppercase font-bold text-gray-400">שיפוע המשיק (הנגזרת)</p>
                            <p className="text-lg font-mono text-rose-600" dir="ltr">f'(x) = {currentM.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-r-4 border-teal-500 text-sm">
                        <p className="font-bold text-teal-800 mb-2">מה אנחנו רואים?</p>
                        <p>הקו האדום המקווקו הוא המשיק לפונקציה בנקודה. <br/> שימו לב שכאשר x חיובי (מימין) השיפוע חיובי, וכאשר x שלילי (משמאל) השיפוע שלילי.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CONTENT PAGES ---

const CoordinateSystemContent = () => (
    <ContentPage title="מערכת צירים" intro="הבסיס לכל הגיאומטריה האנליטית - איך מוצאים את עצמנו במישור.">
        <Section title="מהי מערכת צירים?">
            <p>מערכת הצירים מורכבת משני צירים המאונכים זה לזה:</p>
            <ul className="list-disc mr-6 space-y-2">
                <li><span className="font-bold">ציר ה-X:</span> הציר האופקי (ציר המספרים).</li>
                <li><span className="font-bold">ציר ה-Y:</span> הציר האנכי.</li>
            </ul>
        </Section>
        <Section title="ארבעת הרביעים">
            <QuadrantExplorer />
        </Section>
    </ContentPage>
);

const StraightLineContent = () => (
    <ContentPage title="הקו הישר" intro="משוואת הישר היא הקשר המתמטי בין x ל-y עבור כל נקודה על הקו.">
        <Section title="משוואת הישר המפורשת">
            <Formula title="y = mx + b">
                <p>m = שיפוע הישר | b = נקודת החיתוך עם ציר ה-y</p>
            </Formula>
        </Section>
        <InteractivePointTool />
        <Section title="מציאת שיפוע בין שתי נקודות">
            <p>אם נתונות שתי נקודות (x1, y1) ו-(x2, y2), השיפוע מחושב כך:</p>
            <Formula>
                m = <Fraction numerator="y2 - y1" denominator="x2 - x1" />
            </Formula>
        </Section>
    </ContentPage>
);

const DistanceContent = () => (
    <ContentPage title="מרחק בין נקודות" intro="איך מודדים את אורך הקטע המחבר בין שתי נקודות?">
        <Section title="נוסחת המרחק (דיסטנס)">
            <p>הנוסחה מבוססת על משפט פיתגורס:</p>
            <Formula>
                d = √[(x2 - x1)² + (y2 - y1)²]
            </Formula>
        </Section>
        <Example title="חישוב מרחק">
            <p>נחשב את המרחק בין (0,0) ל-(3,4):</p>
            <p>d = √[(3-0)² + (4-0)²] = √[3² + 4²] = √[9 + 16] = √25 = 5</p>
        </Example>
    </ContentPage>
);

const PerpendicularContent = () => (
    <ContentPage title="ישרים מאונכים" intro="ישרים הנפגשים בזווית של 90 מעלות.">
        <Section title="כלל המכפלה">
            <p>שני ישרים הם מאונכים אם ורק אם מכפלת השיפועים שלהם היא -1.</p>
            <Formula>
                m1 · m2 = -1
            </Formula>
            <p className="mt-4 text-center">במילים אחרות: השיפוע הוא "הופכי ונגדי".</p>
        </Section>
        <Example title="דוגמה">
            <p>אם שיפוע ישר א' הוא 2, שיפוע הישר המאונך לו יהיה -1/2.</p>
        </Example>
    </ContentPage>
);

// --- ADDED MISSING COMPONENTS ---

/**
 * Learn content for Triangle Area Calculation.
 */
const AreaCalcContent = () => (
    <ContentPage title="חישוב שטח משולש" intro="איך מחשבים שטח של משולש במישור הצירים?">
        <Section title="השיטה הבסיסית">
            <p>בגיאומטריה אנליטית, הדרך הפשוטה ביותר לחשב שטח משולש היא באמצעות הנוסחה:</p>
            <Formula>
                S = <Fraction numerator="בסיס × גובה" denominator="2" />
            </Formula>
        </Section>
        <Section title="שלבי עבודה">
            <ol className="list-decimal mr-6 space-y-2">
                <li>מחשבים את אורך הבסיס (דיסטנס בין שתי נקודות על הצלע הנבחרת).</li>
                <li>מחשבים את אורך הגובה לאותה צלע.</li>
                <li>מציבים בנוסחה ומחשבים את השטח.</li>
            </ol>
        </Section>
    </ContentPage>
);

/**
 * Learn content for Equations with Numeric Denominator.
 */
const NumericDenominatorContent = () => (
    <ContentPage title="משוואות עם מכנה מספרי" intro="פתרון משוואות אלגבריות המכילות שברים עם מספרים במכנה.">
        <Section title="שיטת הפתרון">
            <p>השלב הראשון הוא להיפטר מהמכנים על ידי כפל כל המשוואה במכנה משותף מינימלי (מכמ"ל).</p>
        </Section>
        <Example title="דוגמה לפתרון" isHebrew={false}>
            <div dir="ltr" className="text-left font-mono space-y-1">
                <p>x/2 + x/3 = 5  /* 6</p>
                <p>3x + 2x = 30</p>
                <p>5x = 30</p>
                <p>x = 6</p>
            </div>
        </Example>
    </ContentPage>
);

const VariableDenominatorContent = () => (
    <ContentPage title="נעלם במכנה" intro="פתרון משוואות בהן ה-x מופיע בתוך שבר.">
        <Section title="תחום הגדרה">
            <ImportantNote>
                אסור למכנה להיות שווה לאפס! לכן השלב הראשון הוא תמיד למצוא מה x לא יכול להיות.
            </ImportantNote>
        </Section>
        <Section title="שיטת הכפל בהצלבה">
            <p>עבור משוואה מהצורה: A/B = C/D, נשתמש ב- A·D = B·C</p>
        </Section>
    </ContentPage>
);

const TrianglePropertiesContent = () => (
    <ContentPage title="תכונות משולש" intro="שימוש בגיאומטריה אנליטית להוכחת תכונות גיאומטריות.">
        <Section title="תיכון">
            <p>קטע היוצא מקודקוד לאמצע הצלע שמולו. משתמשים בנוסחת <span className="font-bold text-indigo-600">אמצע קטע</span> למציאתו.</p>
        </Section>
        <Section title="גובה">
            <p>קטע היוצא מקודקוד ומאונך לצלע שמולו. משתמשים בכלל <span className="font-bold text-indigo-600">השיפועים המאונכים</span> (m1*m2=-1).</p>
        </Section>
    </ContentPage>
);

const QuadraticEquationsContent = () => (
    <ContentPage title="משוואות ריבועיות" intro="משוואות מהצורה ax² + bx + c = 0">
        <Section title="נוסחת השורשים">
            <p>לפתרון משוואה ריבועית נשתמש בנוסחת השורשים:</p>
            <Formula title="נוסחת השורשים">
                <div className="text-xl font-mono">
                    x<sub>1,2</sub> = <Fraction numerator="-b ± √(b² - 4ac)" denominator="2a" />
                </div>
            </Formula>
        </Section>
    </ContentPage>
);

const DerivativesContent = () => (
    <ContentPage title="נגזרות של פולינומים" intro="מבוא לחשבון דיפרנציאלי - איך גוזרים פונקציה.">
        <Section title="כלל הגזירה הבסיסי">
            <p>עבור פונקציית חזקה: <MathRenderer text="(x^n)' = n · x^{n-1}" /></p>
            <Formula title="נוסחת גזירה">
                <MathRenderer text="(ax^n + bx + c)' = a·n·x^{n-1} + b" />
            </Formula>
        </Section>
        <DerivativeVisualizer />
    </ContentPage>
);

const TangentContent = () => (
    <ContentPage title="משיק לפונקציה" intro="איך מוצאים משוואת ישר ש'נוגע' בפונקציה בנקודה אחת?">
        <Section title="שיפוע המשיק">
            <p>שיפוע המשיק לפונקציה בנקודה מסוימת (x₀) שווה לערך הנגזרת באותה נקודה.</p>
            <Formula>
                m = f'(x₀)
            </Formula>
        </Section>
        <Section title="שלבי עבודה">
            <ol className="list-decimal mr-6 space-y-2">
                <li>גוזרים את הפונקציה כדי למצוא את f'(x).</li>
                <li>מציבים את ה-X של הנקודה בנגזרת לקבלת השיפוע m.</li>
                <li>מציבים את ה-X בפונקציה המקורית לקבלת ה-Y של הנקודה.</li>
                <li>מוצאים משוואת ישר לפי נקודה ושיפוע.</li>
            </ol>
        </Section>
    </ContentPage>
);

const MidpointLearnContent = () => (
    <ContentPage title="אמצע של קטע" intro="בואו נלמד על הקשר בין שיעורי שתי נקודות המהוות קצות קטע, לבין שיעורי נקודת האמצע שלו.">
        <Section title="הנוסחה הכללית">
            <p>כאשר נתון קטע AB שקצותיו הן הנקודות A(x₁, y₁) ו-B(x₂, y₂), ונקודה M היא אמצע הקטע AB, אז מתקיים:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Formula title="שיעור ה-X של נקודת האמצע">
                    x_m = <Fraction numerator="x₁ + x₂" denominator="2" />
                </Formula>
                <Formula title="שיעור ה-Y של נקודת האמצע">
                    y_m = <Fraction numerator="y₁ + y₂" denominator="2" />
                </Formula>
            </div>
        </Section>
    </ContentPage>
);

// --- MAIN LEARN COMPONENT ---

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
        case SUBJECTS.MIDPOINT.id: return <MidpointLearnContent />;
        case SUBJECTS.COORDINATE_SYSTEM.id: return <CoordinateSystemContent />;
        case SUBJECTS.STRAIGHT_LINE.id: return <StraightLineContent />;
        case SUBJECTS.DISTANCE.id: return <DistanceContent />;
        case SUBJECTS.PERPENDICULAR_LINES.id: return <PerpendicularContent />;
        case SUBJECTS.TRIANGLE_PROPERTIES.id: return <TrianglePropertiesContent />;
        case SUBJECTS.AREA_CALC.id: return <AreaCalcContent />;
        case SUBJECTS.QUADRATIC_EQUATIONS.id: return <QuadraticEquationsContent />;
        case SUBJECTS.EQUATIONS_NUMERIC_DENOMINATOR.id: return <NumericDenominatorContent />;
        case SUBJECTS.EQUATIONS_WITH_VARIABLE_DENOMINATOR.id: return <VariableDenominatorContent />;
        case SUBJECTS.DERIVATIVES.id: return <DerivativesContent />;
        case SUBJECTS.TANGENT.id: return <TangentContent />;
        default: return <p>התוכן יתווסף בקרוב!</p>;
    }
  }

  if (!selectedSubject) {
    return (
      <div className={design.layout.standard}>
        <h2 className={design.typography.pageTitle}>מרכז למידה</h2>
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
    <div className="pb-20">
      <button 
        onClick={() => setSelectedSubject(null)}
        className={`mb-6 inline-flex items-center ${design.components.button.base.replace('py-3', 'py-2')} ${design.components.button.secondary}`}
      >
        חזרה לבחירת נושא
      </button>
      {renderContent()}
    </div>
  );
}
