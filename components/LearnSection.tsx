
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SUBJECTS, Subject, Point } from '../types.ts';
import { design } from '../constants/design_system.ts';

// --- MATH RENDERER ---
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

const Fraction = ({ numerator, denominator }) => (
    <div className="inline-flex flex-col items-center align-middle mx-2">
        <span className="px-2">{numerator}</span>
        <hr className="w-full border-t-2 border-gray-700 dark:border-gray-200 my-1" />
        <span className="px-2">{denominator}</span>
    </div>
);

// --- INTERACTIVE VISUALIZERS ---

const CoordinateSystemVisualizer = () => {
    const [hovered, setHovered] = useState<number | null>(null);
    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border-2 border-blue-200 flex flex-col md:flex-row items-center gap-8">
            <svg viewBox="0 0 200 200" className="w-full max-w-[250px] bg-white dark:bg-gray-800 border rounded-xl">
                <line x1="100" y1="0" x2="100" y2="200" stroke="#ccc" />
                <line x1="0" y1="100" x2="200" y2="100" stroke="#ccc" />
                {[1,2,3,4].map(q => (
                    <rect 
                        key={q} 
                        x={q===1||q===4 ? 100 : 0} 
                        y={q===1||q===2 ? 0 : 100} 
                        width="100" height="100" 
                        className={`fill-blue-500 transition-opacity cursor-pointer ${hovered === q ? 'opacity-20' : 'opacity-0'}`}
                        onMouseEnter={() => setHovered(q)}
                        onMouseLeave={() => setHovered(null)}
                    />
                ))}
                <text x="150" y="50" className="text-[10px] font-bold fill-blue-600" textAnchor="middle">I (+,+)</text>
                <text x="50" y="50" className="text-[10px] font-bold fill-blue-600" textAnchor="middle">II (-,+)</text>
                <text x="50" y="150" className="text-[10px] font-bold fill-blue-600" textAnchor="middle">III (-,-)</text>
                <text x="150" y="150" className="text-[10px] font-bold fill-blue-600" textAnchor="middle">IV (+,-)</text>
            </svg>
            <div className="text-right flex-grow">
                <p className="font-bold text-lg mb-2">איך עובדים עם הרביעים?</p>
                <p className="text-gray-600 dark:text-gray-400">העבירו את העכבר על הגרף כדי לראות את סימני ה-x וה-y בכל אזור.</p>
            </div>
        </div>
    );
};

const SimilarityVisualizer = () => {
    const [mode, setMode] = useState<'nested' | 'butterfly'>('nested');
    const [k, setK] = useState(1.5);

    return (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border-2 border-indigo-200">
             <div className="flex gap-2 mb-6">
                <button onClick={() => setMode('nested')} className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${mode === 'nested' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-100'}`}>משולש בתוך משולש</button>
                <button onClick={() => setMode('butterfly')} className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${mode === 'butterfly' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-100'}`}>צורת פרפר (X)</button>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
                <svg viewBox="0 0 200 150" className="w-full max-w-[300px] bg-white dark:bg-gray-800 border rounded-xl">
                    {mode === 'nested' ? (
                        <g>
                            <polygon points="100,20 40,130 160,130" fill="none" stroke="#6366f1" strokeWidth="2" />
                            <line x1={100 - (60/k)} y1={20 + (110/k)} x2={100 + (60/k)} y2={20 + (110/k)} stroke="#f43f5e" strokeWidth="2" strokeDasharray="4" />
                            <text x="100" y="15" className="text-[10px] fill-gray-500" textAnchor="middle">A</text>
                            <text x="35" y="140" className="text-[10px] fill-gray-500" textAnchor="middle">B</text>
                            <text x="165" y="140" className="text-[10px] fill-gray-500" textAnchor="middle">C</text>
                        </g>
                    ) : (
                        <g>
                            <line x1="40" y1="30" x2="160" y2="120" stroke="#6366f1" strokeWidth="2" />
                            <line x1="160" y1="30" x2="40" y2="120" stroke="#6366f1" strokeWidth="2" />
                            <line x1="40" y1="30" x2="160" y2="30" stroke="#f43f5e" strokeWidth="2" />
                            <line x1="40" y1="120" x2="160" y2="120" stroke="#f43f5e" strokeWidth="2" />
                        </g>
                    )}
                </svg>
                <div className="flex-grow space-y-4 text-right">
                    <p className="font-bold text-indigo-800">מה אנחנו רואים?</p>
                    <p className="text-sm">בגלל שהקווים האדומים מקבילים, נוצרות זוויות שוות (מתאימות או מתחלפות), ולכן המשולשים דומים לפי משפט <b>ז.ז</b>.</p>
                </div>
            </div>
        </div>
    );
};

const TangentVisualizer = () => {
    const [x, setX] = useState(1);
    const fx = (val) => 0.5 * val * val;
    const fpx = (val) => val; // derivative of 0.5x^2 is x
    const toSvg = (mx, my) => ({ x: 150 + mx * 20, y: 150 - my * 20 });
    
    const points = [];
    for (let i = -6; i <= 6; i += 0.2) {
        const p = toSvg(i, fx(i));
        points.push(`${p.x},${p.y}`);
    }

    const m = fpx(x);
    const y0 = fx(x);
    const t1 = toSvg(x - 2, y0 - m * 2);
    const t2 = toSvg(x + 2, y0 + m * 2);

    return (
        <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-2xl border-2 border-teal-200">
            <h4 className="font-bold text-center mb-4">חוקר משיק ונגזרת</h4>
            <div className="flex flex-col md:flex-row items-center gap-8">
                <svg viewBox="0 0 300 300" className="w-full max-w-[250px] bg-white dark:bg-gray-800 border rounded-xl">
                    <line x1="150" y1="0" x2="150" y2="300" stroke="#eee" />
                    <line x1="0" y1="150" x2="300" y2="150" stroke="#eee" />
                    <polyline points={points.join(' ')} fill="none" stroke="#14b8a6" strokeWidth="2" />
                    <line x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y} stroke="#f43f5e" strokeWidth="2" strokeDasharray="4" />
                    <circle cx={toSvg(x, y0).x} cy={toSvg(x, y0).y} r="5" fill="#f43f5e" />
                </svg>
                <div className="flex-grow space-y-4">
                    <input type="range" min="-4" max="4" step="0.1" value={x} onChange={e => setX(parseFloat(e.target.value))} className="w-full accent-teal-500" />
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg text-center shadow-sm">
                        <p className="text-xs font-bold text-gray-400">שיפוע המשיק (הנגזרת)</p>
                        <p className="text-2xl font-mono text-teal-600">m = f'({x.toFixed(1)}) = {m.toFixed(1)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PAGES ---

const CoordinateSystemPage = () => (
    <ContentPage title="מערכת צירים" intro="היכרות עם המישור הדו-ממדי.">
        <CoordinateSystemVisualizer />
        <Section title="זיהוי נקודה">
            <p>כל נקודה מיוצגת על ידי זוג מספרים (x, y). המספר הראשון קובע את המרחק ימינה או שמאלה, והשני את המרחק למעלה או למטה.</p>
        </Section>
    </ContentPage>
);

const StraightLinePage = () => (
    <ContentPage title="הקו הישר" intro="משוואת הישר: הקשר הליניארי בין x ל-y.">
        <Formula title="y = mx + b">
            <p>m = שיפוע | b = נקודת חיתוך עם ציר ה-y</p>
        </Formula>
        <Example title="איך מוצאים שיפוע?">
            <p>השיפוע m הוא 'קצב השינוי'. הוא מחושב על ידי:</p>
            <Formula>m = <Fraction numerator="y2 - y1" denominator="x2 - x1" /></Formula>
        </Example>
    </ContentPage>
);

const SimilarityPage = () => (
    <ContentPage title="דמיון משולשים (ז.ז)" intro="כאשר משולשים נראים אותו דבר אבל בגדלים שונים.">
        <SimilarityVisualizer />
        <Section title="משפט דמיון זווית-זווית">
            <p>אם לשני משולשים יש שתי זוויות שוות בהתאמה, הם דומים. זה אומר שהיחס בין הצלעות שלהם קבוע.</p>
            <Formula>
                <Fraction numerator="AB" denominator="DE" /> = <Fraction numerator="BC" denominator="EF" /> = k
            </Formula>
        </Section>
    </ContentPage>
);

const AverageRatePage = () => (
    <ContentPage title="קצב שינוי ממוצע" intro="מדידת השינוי של פונקציה בין שתי נקודות.">
        <Section title="שיפוע המיתר">
            <p>קצב השינוי הממוצע הוא פשוט השיפוע של הקו המחבר שתי נקודות על הפונקציה.</p>
            <Formula>
                Rate = <Fraction numerator="f(x2) - f(x1)" denominator="x2 - x1" />
            </Formula>
        </Section>
    </ContentPage>
);

const DerivativesPage = () => (
    <ContentPage title="נגזרות פולינומים" intro="איך לחשב את השיפוע של פונקציה בכל נקודה.">
        <Section title="חוקי הגזירה">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Formula title="חזקה">
                    <MathRenderer text="(x^n)' = n · x^{n-1}" />
                </Formula>
                <Formula title="קבוע">
                    <MathRenderer text="(C)' = 0" />
                </Formula>
                <Formula title="סכום">
                    <MathRenderer text="(f + g)' = f' + g'" />
                </Formula>
                <Formula title="כפל בקבוע">
                    <MathRenderer text="(k·f)' = k·f'" />
                </Formula>
            </div>
        </Section>
    </ContentPage>
);

const TangentPage = () => (
    <ContentPage title="משיק לפונקציה" intro="מציאת משוואת הישר שנוגע בגרף בנקודה אחת.">
        <TangentVisualizer />
        <Section title="תהליך הפתרון">
            <ol className="list-decimal mr-6 space-y-4">
                <li><b>גזירה:</b> גוזרים את הפונקציה לקבלת <MathRenderer text="f'(x)" />.</li>
                <li><b>שיפוע:</b> מציבים את ה-x של הנקודה בנגזרת לקבלת m.</li>
                <li><b>נקודה:</b> מוודאים שיש לנו את ה-y של הנקודה (על ידי הצבה בפונקציה המקורית).</li>
                <li><b>משוואה:</b> משתמשים בנוסחה <MathRenderer text="y - y1 = m(x - x1)" />.</li>
            </ol>
        </Section>
    </ContentPage>
);

const EquationsPage = ({ title, type }) => (
    <ContentPage title={title} intro="פתרון משוואות אלגבריות בשלבים.">
        <Section title="שיטת העבודה">
            {type === 'numeric' ? (
                <p>כשיש מספר במכנה, נכפיל את כל המשוואה במכנה המשותף כדי 'להיפטר' מהשברים.</p>
            ) : (
                <p>כשיש נעלם במכנה, חשוב קודם כל לקבוע <b>תחום הגדרה</b> (המכנה לא יכול להיות 0!).</p>
            )}
            <Example title="דוגמה לפתרון" isHebrew={false}>
                <div dir="ltr" className="font-mono bg-gray-100 p-4 rounded text-center">
                    x/2 + 3 = 7  /* 2 <br/>
                    x + 6 = 14 <br/>
                    x = 8
                </div>
            </Example>
        </Section>
    </ContentPage>
);

const MidpointPage = () => (
    <ContentPage title="אמצע קטע" intro="מציאת הנקודה שנמצאת בדיוק באמצע.">
        <Section title="נוסחת האמצע">
            <div className="grid grid-cols-2 gap-4">
                <Formula>x_m = <Fraction numerator="x1 + x2" denominator="2" /></Formula>
                <Formula>y_m = <Fraction numerator="y1 + y2" denominator="2" /></Formula>
            </div>
        </Section>
    </ContentPage>
);

const DistancePage = () => (
    <ContentPage title="מרחק (דיסטנס)" intro="חישוב אורך קטע בין שתי נקודות.">
        <Formula>
            d = √[(x2 - x1)² + (y2 - y1)²]
        </Formula>
    </ContentPage>
);

// --- MAIN COMPONENT ---

export default function LearnSection() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const groupedSubjects = useMemo(() => {
    return Object.values(SUBJECTS).reduce((acc, subject) => {
        const category = subject.category || 'כללי';
        if (!acc[category]) acc[category] = [];
        acc[category].push(subject);
        return acc;
    }, {} as Record<string, Subject[]>);
  }, []);

  const renderContent = () => {
    if (!selectedSubject) return null;
    switch(selectedSubject.id) {
        case SUBJECTS.COORDINATE_SYSTEM.id: return <CoordinateSystemPage />;
        case SUBJECTS.STRAIGHT_LINE.id: return <StraightLinePage />;
        case SUBJECTS.SIMILARITY.id: return <SimilarityPage />;
        case SUBJECTS.AVERAGE_CHANGE_RATE.id: return <AverageRatePage />;
        case SUBJECTS.DERIVATIVES.id: return <DerivativesPage />;
        case SUBJECTS.TANGENT.id: return <TangentPage />;
        case SUBJECTS.MIDPOINT.id: return <MidpointPage />;
        case SUBJECTS.DISTANCE.id: return <DistancePage />;
        case SUBJECTS.EQUATIONS_NUMERIC_DENOMINATOR.id: return <EquationsPage title="משוואות עם מכנה מספרי" type="numeric" />;
        case SUBJECTS.EQUATIONS_WITH_VARIABLE_DENOMINATOR.id: return <EquationsPage title="משוואות עם נעלם במכנה" type="variable" />;
        default: return (
            <ContentPage title={selectedSubject.name} intro="דף מידע אינטראקטיבי.">
                <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300">
                    <p>הסבר מפורט עבור {selectedSubject.name} נמצא כעת בתרגול. עברו ללשונית התרגול כדי להתחיל!</p>
                </div>
            </ContentPage>
        );
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
      <button onClick={() => setSelectedSubject(null)} className={`mb-6 inline-flex items-center ${design.components.button.base.replace('py-3', 'py-2')} ${design.components.button.secondary}`}>
        חזרה לבחירת נושא
      </button>
      {renderContent()}
    </div>
  );
}
