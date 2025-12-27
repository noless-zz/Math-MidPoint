import React, { useState, useMemo } from 'react';
import { SUBJECTS, Subject, Point } from '../types.ts';
import { design } from '../constants/design_system.ts';

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

// --- INTERACTIVE CALCULATORS ---

const InteractiveMidpoint = () => {
    const [p1, setP1] = useState<Point>({ x: 0, y: 0 });
    const [p2, setP2] = useState<Point>({ x: 4, y: 6 });
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border-2 border-indigo-200">
            <h4 className="font-bold text-lg mb-4">מחשבון אמצע קטע אינטראקטיבי</h4>
            <div className="grid grid-cols-2 gap-4 mb-6" dir="ltr">
                <div className="space-y-2">
                    <p className="font-bold text-blue-600">Point A</p>
                    <input type="number" value={p1.x} onChange={e => setP1({...p1, x: Number(e.target.value)})} className="w-full p-2 border rounded" placeholder="x1" />
                    <input type="number" value={p1.y} onChange={e => setP1({...p1, y: Number(e.target.value)})} className="w-full p-2 border rounded" placeholder="y1" />
                </div>
                <div className="space-y-2">
                    <p className="font-bold text-orange-600">Point B</p>
                    <input type="number" value={p2.x} onChange={e => setP2({...p2, x: Number(e.target.value)})} className="w-full p-2 border rounded" placeholder="x2" />
                    <input type="number" value={p2.y} onChange={e => setP2({...p2, y: Number(e.target.value)})} className="w-full p-2 border rounded" placeholder="y2" />
                </div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded shadow-inner">
                <p className="font-bold">שלבי הפתרון:</p>
                <p dir="ltr" className="font-mono mt-2">xM = ({p1.x} + {p2.x}) / 2 = {mx}</p>
                <p dir="ltr" className="font-mono">yM = ({p1.y} + {p2.y}) / 2 = {my}</p>
                <p className="text-xl font-bold text-indigo-600 mt-2">M ({mx}, {my})</p>
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
            <div className="grid grid-cols-2 gap-4 text-center font-bold">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded">רביע ראשון: (+, +)</div>
                <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded">רביע שני: (-, +)</div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded">רביע שלישי: (-, -)</div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded">רביע רביעי: (+, -)</div>
            </div>
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
        <Section title="מציאת שיפוע בין שתי נקודות">
            <p>אם נתונות שתי נקודות (x1, y1) ו-(x2, y2), השיפוע מחושב כך:</p>
            <Formula>
                m = <Fraction numerator="y2 - y1" denominator="x2 - x1" />
            </Formula>
        </Section>
        <Example title="דוגמה למציאת משוואה">
            <p>מצאו משוואת ישר העובר ב-(1, 2) עם שיפוע m=3.</p>
            <p>נציב בנוסחה: y - y1 = m(x - x1)</p>
            <p>y - 2 = 3(x - 1)  =>  y = 3x - 1</p>
        </Example>
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
        <Example title="דוגמה">
            <p>10 / (x + 2) = 2</p>
            <p>תחום הגדרה: x ≠ -2</p>
            <p>נכפול ב-(x+2): 10 = 2(x + 2)  =>  10 = 2x + 4  =>  2x = 6  =>  x = 3</p>
        </Example>
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
        <Section title="משולש ישר זווית">
            <p>מוכיחים ששני ישרים מאונכים, או שמתקיים משפט פיתגורס עם המרחקים.</p>
        </Section>
    </ContentPage>
);

const AreaCalcContent = () => (
    <ContentPage title="שטח משולש" intro="איך מחשבים שטח במערכת צירים?">
        <Section title="הנוסחה הבסיסית">
            <Formula>
                S = (בסיס · גובה) / 2
            </Formula>
        </Section>
        <ImportantNote>
            בגיאומטריה אנליטית, הכי קל לבחור כבסיס צלע המקבילה לאחד הצירים (ה-X או ה-Y). במקרה כזה, הגובה הוא פשוט הפרש שיעורי הנקודה השלישית מהצלע.
        </ImportantNote>
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
            <Example title="דוגמה לפתרון">
                <p>נפתור את המשוואה: x² - 5x + 6 = 0</p>
                <p>מקדמים: a=1, b=-5, c=6</p>
                <p>דיסקרימיננטה: Δ = (-5)² - 4*1*6 = 25 - 24 = 1</p>
                <p>שורשים: x = (5 ± √1) / 2</p>
                <p>פתרונות: x1 = 3, x2 = 2</p>
            </Example>
        </Section>
    </ContentPage>
);

const NumericDenominatorContent = () => (
    <ContentPage title="משוואות עם מכנה מספרי" intro="פתרון משוואות המכילות שברים עם מספרים במכנה.">
        <Section title="שיטת המכנה המשותף">
            <p>כדי להיפטר מהשברים, עלינו לכפול את כל המשוואה במכנה המשותף של כל המספרים במכנים.</p>
            <Example title="דוגמה">
                <p>פתרו: <Fraction numerator="x-6" denominator="8" /> + <Fraction numerator="x+3" denominator="12" /> = 3</p>
                <p>מכנה משותף של 8 ו-12 הוא 24.</p>
                <p>נכפול ב-24: 3(x-6) + 2(x+3) = 24 * 3</p>
                <p>3x - 18 + 2x + 6 = 72</p>
                <p>5x - 12 = 72 => 5x = 84 => x = 16.8</p>
            </Example>
        </Section>
    </ContentPage>
);

const DerivativesContent = () => (
    <ContentPage title="נגזרות של פולינומים" intro="מבוא לחשבון דיפרנציאלי - איך גוזרים פונקציה.">
        <Section title="כלל הגזירה הבסיסי">
            <p>עבור פונקציית חזקה: (xⁿ)' = n &middot; xⁿ⁻¹</p>
            <Formula title="נוסחת גזירה">
                (axⁿ + bx + c)' = a&middot;n&middot;xⁿ⁻¹ + b
            </Formula>
            <Example title="דוגמאות">
                <p>f(x) = x³  =>  f'(x) = 3x²</p>
                <p>f(x) = 4x² + 5x - 2  =>  f'(x) = 8x + 5</p>
                <p>f(x) = 10  =>  f'(x) = 0</p>
            </Example>
        </Section>
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
        <InteractiveMidpoint />
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