import re

with open('thrive/hope-survey.html', 'r') as f:
    content = f.read()

# 1. Replace ResultsScreen definition with HopeChart + ResultsScreen
hope_chart_code = """
const HopeChart = ({ answers, surveyQuestions, isFinal }) => {
        const [isMounted, setIsMounted] = useState(false);
        const totalScore = Object.values(answers).reduce((a, b) => a + b, 0); // Out of 100 max
        
        useEffect(() => {
            setTimeout(() => setIsMounted(true), 100);
        }, []);

        const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
            const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
            return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
            };
        };

        const describeArc = (x, y, innerRadius, outerRadius, startAngle, endAngle) => {
            const startOut = polarToCartesian(x, y, outerRadius, endAngle);
            const endOut = polarToCartesian(x, y, outerRadius, startAngle);
            const startIn = polarToCartesian(x, y, innerRadius, endAngle);
            const endIn = polarToCartesian(x, y, innerRadius, startAngle);
            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
            return [
                "M", startOut.x, startOut.y,
                "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOut.x, endOut.y,
                "L", endIn.x, endIn.y,
                "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startIn.x, startIn.y,
                "Z"
            ].join(" ");
        };

        const cx = 500;
        const cy = 420; 
        const innerR = 180;
        const maxOutR = 360; 
        
        const dimensionColors = [
            '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7ff', '#af52de'
        ];
        const dimensionNames = ["PLACES", "BODY", "RESOURCES", "SELF", "OTHERS", "LIFE"];

        const coreQuestions = surveyQuestions.slice(0, 18);
        const flex1Score = answers[surveyQuestions[18]?.id] ?? 0;
        const flex2Score = answers[surveyQuestions[19]?.id] ?? 0;

        return (
                <div className={`relative z-10 w-full rounded-3xl border border-cyan-500/20 bg-[#050a14]/90 backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,229,255,0.07)] p-6 md:p-10 overflow-y-auto custom-scrollbar flex flex-col transition-opacity duration-1000 ${isMounted ? 'opacity-100' : 'opacity-0'}`} style={{ maxHeight: '100%' }}>
                    <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-cyan-500/50 rounded-tl-3xl opacity-50"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-cyan-500/50 rounded-tr-3xl opacity-50"></div>

                    <div className="text-center mb-8 relative shrink-0">
                        <div className="inline-block">
                            <h1 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100 tracking-widest mb-1" style={{ textShadow: '0 0 40px rgba(0,229,255,0.3)' }}>
                                THE HOPE INDEX
                            </h1>
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 mt-1 mb-2"></div>
                            <p className="text-cyan-400 font-medium text-xs md:text-sm tracking-[0.2em] uppercase">
                                (Human Optimized Personal Experience)
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full shrink-0 mx-auto" style={{ aspectRatio: '2/1.3', maxHeight: isFinal ? '500px' : '450px' }}>
                        <svg viewBox="0 0 1000 650" className="w-full h-full drop-shadow-2xl overflow-visible">
                            <defs>
                                <filter id="glow-soft" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                                <filter id="glow-intense" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="10" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                                <linearGradient id="score-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(0, 229, 255, 0.2)" />
                                    <stop offset="100%" stopColor="rgba(0, 229, 255, 0.05)" />
                                </linearGradient>
                            </defs>

                            {dimensionNames.map((name, i) => {
                                const startA = -90 + (i * 30);
                                const endA = startA + 30;
                                const midA = startA + 15;
                                const labelPos = polarToCartesian(cx, cy, maxOutR + 55, midA);
                                const color = dimensionColors[i];
                                return (
                                    <g key={`dim-${i}`} style={{ opacity: isMounted ? 1 : 0, transition: `opacity 1s ease 0.5s` }}>
                                        <path d={describeArc(cx, cy, maxOutR + 25, maxOutR + 27, startA + 1, endA - 1)} fill={color} opacity="0.4" filter="url(#glow-soft)" />
                                        <text x={labelPos.x} y={labelPos.y} fill={color} fontSize="14" fontWeight="800" textAnchor="middle" alignmentBaseline="middle" style={{ transform: `rotate(${midA}deg)`, transformOrigin: `${labelPos.x}px ${labelPos.y}px`, letterSpacing: '3px', textShadow: `0 0 10px ${color}` }}>{name}</text>
                                    </g>
                                );
                            })}

                            {coreQuestions.map((_, i) => {
                                const angle = -90 + (i * 10) + 5; 
                                const start = polarToCartesian(cx, cy, innerR - 10, angle);
                                const destX = cx + (i - 8.5) * 16; 
                                const destY = cy + 20;
                                return (
                                    <path key={`trace-${i}`} d={`M ${start.x} ${start.y} Q ${cx} ${cy} ${destX} ${destY}`} fill="none" stroke="#00e5ff" strokeWidth="1.5" opacity={isMounted ? "0.2" : "0"} style={{ transition: `opacity 1s ease 0.5s` }} />
                                );
                            })}

                            {coreQuestions.map((q, i) => {
                                const score = answers[q.id] ?? 0;
                                const dimIndex = Math.floor(i / 3);
                                const color = dimensionColors[dimIndex];
                                const startA = -90 + (i * 10);
                                const endA = startA + 8.5; 
                                
                                const scoreR = innerR + (score / 5) * (maxOutR - innerR);
                                
                                const basePath = describeArc(cx, cy, innerR, maxOutR, startA, endA);
                                const scorePath = describeArc(cx, cy, innerR, scoreR, startA, endA);

                                return (
                                    <g key={`slice-${i}`}>
                                        <path d={basePath} fill={color} opacity="0.05" />
                                        <path d={scorePath} fill={color} filter="url(#glow-soft)" opacity="0.9" style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                        {score > 0 && (
                                            <path d={describeArc(cx, cy, scoreR - 4, scoreR, startA, endA)} fill="#ffffff" opacity="0.5" style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                        )}
                                        <text {...polarToCartesian(cx, cy, innerR - 25, startA + 4.25)} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle" opacity="0.5">{i + 1}</text>
                                    </g>
                                );
                            })}

                            <g transform={`translate(${cx - 160}, ${cy + 20})`} style={{ opacity: isMounted ? 1 : 0, transition: 'opacity 1s ease 0.5s' }}>
                                <rect x="0" y="0" width="320" height="140" rx="15" fill="url(#score-gradient)" stroke="#00e5ff" strokeWidth="2" filter="url(#glow-soft)" />
                                <rect x="-10" y="20" width="2" height="100" fill="#00e5ff" filter="url(#glow-soft)" />
                                <rect x="328" y="20" width="2" height="100" fill="#00e5ff" filter="url(#glow-soft)" />
                                
                                <text x="160" y="30" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle" letterSpacing="2px">TOTAL HOPE INDEX SCORE</text>
                                <text x="160" y="50" fill="#00e5ff" fontSize="12" fontWeight="bold" textAnchor="middle" opacity="0.7" letterSpacing="1px">(0-100%)</text>
                                
                                <text x="140" y="115" fill="#ffffff" fontSize="64" fontWeight="900" textAnchor="middle" filter="url(#glow-intense)" style={{ fontFamily: 'sans-serif' }}>
                                    {Math.round(totalScore)}
                                </text>
                                <text x="200" y="115" fill="#00e5ff" fontSize="24" fontWeight="bold" textAnchor="start" opacity="0.8">/100</text>
                            </g>
                            
                            <path d={`M ${cx - 80} ${cy + 160} L ${cx - 80} ${cy + 190} L ${cx - 240} ${cy + 190} L ${cx - 240} ${cy + 230}`} fill="none" stroke="#00e5ff" strokeWidth="2" opacity={isMounted ? "0.4" : "0"} filter="url(#glow-soft)" style={{ transition: 'opacity 1s ease 0.5s' }} />
                            <path d={`M ${cx + 80} ${cy + 160} L ${cx + 80} ${cy + 190} L ${cx + 240} ${cy + 190} L ${cx + 240} ${cy + 230}`} fill="none" stroke="#00e5ff" strokeWidth="2" opacity={isMounted ? "0.4" : "0"} filter="url(#glow-soft)" style={{ transition: 'opacity 1s ease 0.5s' }} />
                        </svg>
                    </div>

                    <div className={`mt-4 shrink-0 border border-cyan-500/30 rounded-2xl bg-[#03060d]/80 p-6 md:p-8 relative shadow-[inset_0_0_30px_rgba(0,229,255,0.02)] transition-opacity duration-1000 ${isMounted ? 'opacity-100 delay-[500ms]' : 'opacity-0'}`}>
                        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-cyan-400 rounded-tl-2xl"></div>
                        <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-cyan-400 rounded-tr-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-cyan-400 rounded-bl-2xl"></div>
                        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-cyan-400 rounded-br-2xl"></div>
                        
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#050a14] px-6 py-1 text-cyan-300 text-sm font-bold tracking-[0.15em] uppercase border border-cyan-500/50 rounded-full shadow-[0_0_15px_rgba(0,229,255,0.4)] whitespace-nowrap">
                            Population-Specific Context
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-4 pt-4 pb-2">
                            <div className="flex items-center gap-6 justify-center">
                                <div className="relative w-24 h-24 shrink-0">
                                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(0,229,255,0.3)]">
                                        {[0,1,2,3,4,5].map(tick => {
                                            const a = -120 + (tick / 5) * 240;
                                            const p1 = polarToCartesian(50, 50, 42, a);
                                            const p2 = polarToCartesian(50, 50, 46, a);
                                            return <line key={tick} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#00e5ff" strokeWidth="2" opacity="0.6"/>;
                                        })}
                                        <path d={describeArc(50, 50, 36, 40, -120, 120)} fill="#0a1526" stroke="#00e5ff" strokeWidth="0.5" opacity="0.5" />
                                        <path d={describeArc(50, 50, 36, 40, -120, -120 + (flex1Score / 5) * 240)} fill="#00e5ff" filter="url(#glow-soft)" style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                        <g style={{ transform: `rotate(${-120 + (flex1Score / 5) * 240}deg)`, transformOrigin: '50px 50px', transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                                            <polygon points="48.5,50 51.5,50 50,12" fill="#ffffff" filter="url(#glow-soft)" />
                                            <circle cx="50" cy="50" r="5" fill="#00e5ff" stroke="#ffffff" strokeWidth="1.5" />
                                        </g>
                                    </svg>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-cyan-400 font-bold text-sm bg-[#03060d] px-2 rounded-full border border-cyan-500/20">{flex1Score.toFixed(1)}</div>
                                </div>
                                <div className="max-w-[200px]">
                                    <h3 className="text-white font-bold text-sm md:text-base leading-tight mb-1">GANG DE-IDENTIFICATION</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 justify-center border-t md:border-t-0 md:border-l border-cyan-500/20 pt-6 md:pt-0 md:pl-6">
                                <div className="relative w-24 h-24 shrink-0">
                                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(0,229,255,0.3)]">
                                        {[0,1,2,3,4,5].map(tick => {
                                            const a = -120 + (tick / 5) * 240;
                                            const p1 = polarToCartesian(50, 50, 42, a);
                                            const p2 = polarToCartesian(50, 50, 46, a);
                                            return <line key={tick} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#00e5ff" strokeWidth="2" opacity="0.6"/>;
                                        })}
                                        <path d={describeArc(50, 50, 36, 40, -120, 120)} fill="#0a1526" stroke="#00e5ff" strokeWidth="0.5" opacity="0.5" />
                                        <path d={describeArc(50, 50, 36, 40, -120, -120 + (flex2Score / 5) * 240)} fill="#00e5ff" filter="url(#glow-soft)" style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                        <g style={{ transform: `rotate(${-120 + (flex2Score / 5) * 240}deg)`, transformOrigin: '50px 50px', transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                                            <polygon points="48.5,50 51.5,50 50,12" fill="#ffffff" filter="url(#glow-soft)" />
                                            <circle cx="50" cy="50" r="5" fill="#00e5ff" stroke="#ffffff" strokeWidth="1.5" />
                                        </g>
                                    </svg>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-cyan-400 font-bold text-sm bg-[#03060d] px-2 rounded-full border border-cyan-500/20">{flex2Score.toFixed(1)}</div>
                                </div>
                                <div className="max-w-[200px]">
                                    <h3 className="text-white font-bold text-sm md:text-base leading-tight mb-1">PSYCHOLOGICAL SAFETY</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isFinal && (
                        <div className={`shrink-0 flex flex-col sm:flex-row gap-4 mt-8 justify-center transition-opacity duration-1000 ${isMounted ? 'opacity-100 delay-[1000ms]' : 'opacity-0'}`}>
                            <button onClick={() => window.print()} className="px-8 py-4 bg-transparent border-2 border-cyan-500/50 text-cyan-400 font-bold rounded-full hover:bg-cyan-500/10 hover:border-cyan-400 hover:text-cyan-300 transition-all shadow-[0_0_20px_rgba(0,229,255,0.1)] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] tracking-wide uppercase text-sm">
                                Export PDF Report
                            </button>
                            <button onClick={() => window.location.reload()} className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black rounded-full hover:from-cyan-500 hover:to-blue-500 transition-all shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] hover:-translate-y-1 tracking-wide uppercase text-sm border border-cyan-400/50">
                                Retake Assessment
                            </button>
                        </div>
                    )}
                </div>
        );
};

const ResultsScreen = ({ answers, surveyQuestions }) => {
    return (
        <main className="flex-grow flex items-center justify-center bg-[#02050a] p-4 md:p-8 relative w-full overflow-hidden min-h-screen">
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.08) 0%, transparent 60%), linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px)',
                backgroundSize: '100% 100%, 30px 30px, 30px 30px',
                backgroundPosition: 'center center'
            }}></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[300px] bg-cyan-500 rounded-[100%] blur-[150px] opacity-[0.05] pointer-events-none"></div>
            
            <div className="w-full max-w-[1100px] flex justify-center items-center">
                <HopeChart answers={answers} surveyQuestions={surveyQuestions} isFinal={true} />
            </div>
        </main>
    );
};
"""

# Regex substitute the old ResultsScreen with HopeChart + ResultsScreen
content = re.sub(r'const ResultsScreen = \(\{ answers, surveyQuestions \}\) => \{.*?\n\};\n', hope_chart_code, content, flags=re.DOTALL)

# Modify Survey App render for split screen
survey_screen_regex = r'(// --- SURVEY SCREEN ---.*?return \(\n\s*)<main className="flex-grow p-4 md:p-8 flex flex-col items-center">(.*?)<\/main>'
survey_screen_replacement = r'''\1<main className="flex-grow p-4 md:p-8 w-full max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 h-full">
                {/* Left Column - Survey Form */}
                <div className="flex flex-col max-w-2xl mx-auto w-full">
\2
                </div>
                {/* Right Column - Results Display */}
                <div className="hidden lg:flex flex-col w-full sticky top-8" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
                    <div className="absolute inset-0 pointer-events-none bg-[#02050a] rounded-3xl -z-10" style={{
                        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.08) 0%, transparent 60%), linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px)',
                        backgroundSize: '100% 100%, 30px 30px, 30px 30px',
                        backgroundPosition: 'center center'
                    }}></div>
                    <HopeChart answers={{...answers, [q.id]: currentSelection !== null ? currentSelection : 2.5}} surveyQuestions={surveyQuestions} isFinal={false} />
                </div>
            </div>
        </main>'''

content = re.sub(survey_screen_regex, survey_screen_replacement, content, flags=re.DOTALL)

with open('thrive/hope-survey.html', 'w') as f:
    f.write(content)

