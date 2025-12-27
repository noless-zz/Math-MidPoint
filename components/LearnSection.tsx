import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { SUBJECTS, Subject } from '../types.ts';
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

const MathEquation = ({ children, explanation=null }: { children?: React.ReactNode, explanation?: string | null }) => (
    <div className="text-center my-4">
        <div dir="ltr" className="p-4 bg-gray-200 dark:bg-gray-700 rounded-md text-lg md:text-xl font-mono shadow-inner inline-block">
            {children}
        </div>
        {explanation && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{explanation}</p>}
    </div>
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
        <Section title="משיק לפונקציה">
            <p>שיפוע המשיק לפונקציה בנקודה מסוימת שווה לערך הנגזרת באותה נקודה.</p>
            <ImportantNote>
                m = f'(x₀)
            </ImportantNote>
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
        case SUBJECTS.QUADRATIC_EQUATIONS.id:
            return <QuadraticEquationsContent />;
        case SUBJECTS.EQUATIONS_NUMERIC_DENOMINATOR.id:
            return <NumericDenominatorContent />;
        case SUBJECTS.DERIVATIVES.id:
        case SUBJECTS.TANGENT.id:
            return <DerivativesContent />;
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
    <div>
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