import re

with open('thrive/hope-survey.html', 'r') as f:
    content = f.read()

# 1. Unhide the Right Column on mobile
# Replace: <div className="hidden lg:flex flex-col w-full sticky top-8" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
# With: <div className="flex flex-col w-full lg:sticky lg:top-8 mt-12 lg:mt-0 lg:max-h-[calc(100vh-4rem)]">
content = content.replace(
    '<div className="hidden lg:flex flex-col w-full sticky top-8" style={{ maxHeight: \'calc(100vh - 4rem)\' }}>',
    '<div className="flex flex-col w-full lg:sticky lg:top-8 mt-12 lg:mt-0 lg:max-h-[calc(100vh-4rem)]">'
)

# 2. Inject CSS style into HopeChart
style_block = '''
                    <style>
                        {`
                        @media (max-width: 768px) {
                            .chart-dim-text { font-size: 35px !important; }
                            .chart-slice-text { font-size: 30px !important; }
                            .chart-score-title { font-size: 35px !important; }
                            .chart-score-subtitle { font-size: 28px !important; }
                            .chart-score-main { font-size: 120px !important; }
                            .chart-score-max { font-size: 50px !important; }
                            /* Adjust central box size for larger text */
                            .chart-center-box { width: 440px !important; height: 200px !important; x: -60px !important; y: -30px !important; }
                            .chart-center-line-1 { height: 160px !important; x: -70px !important; y: -10px !important; }
                            .chart-center-line-2 { height: 160px !important; x: 388px !important; y: -10px !important; }
                            .chart-score-title { transform: translateY(-10px); }
                            .chart-score-subtitle { transform: translateY(-5px); }
                            .chart-score-main { transform: translateY(20px); }
                            .chart-score-max { transform: translateY(20px); }
                        }
                        `}
                    </style>
'''
content = content.replace(
    '<div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-cyan-500/50 rounded-tr-3xl opacity-50"></div>',
    '<div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-cyan-500/50 rounded-tr-3xl opacity-50"></div>' + style_block
)

# 3. Add classes to texts
content = content.replace(
    'fontSize="14" fontWeight="800" textAnchor="middle"',
    'fontSize="14" fontWeight="800" textAnchor="middle" className="chart-dim-text"'
)
content = content.replace(
    'fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle"',
    'fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle" className="chart-slice-text"'
)
content = content.replace(
    'fontSize="16" fontWeight="bold" textAnchor="middle" letterSpacing="2px"',
    'fontSize="16" fontWeight="bold" textAnchor="middle" letterSpacing="2px" className="chart-score-title"'
)
content = content.replace(
    'fontSize="12" fontWeight="bold" textAnchor="middle" opacity="0.7" letterSpacing="1px"',
    'fontSize="12" fontWeight="bold" textAnchor="middle" opacity="0.7" letterSpacing="1px" className="chart-score-subtitle"'
)
content = content.replace(
    'fontSize="64" fontWeight="900" textAnchor="middle" filter="url(#glow-intense)" style={{ fontFamily: \'sans-serif\' }}',
    'fontSize="64" fontWeight="900" textAnchor="middle" filter="url(#glow-intense)" className="chart-score-main" style={{ fontFamily: \'sans-serif\' }}'
)
content = content.replace(
    'fontSize="24" fontWeight="bold" textAnchor="start" opacity="0.8"',
    'fontSize="24" fontWeight="bold" textAnchor="start" opacity="0.8" className="chart-score-max"'
)

# 4. Add classes to the rects in central box so we can resize them
content = content.replace(
    '<rect x="0" y="0" width="320" height="140" rx="15" fill="url(#score-gradient)" stroke="#00e5ff" strokeWidth="2" filter="url(#glow-soft)" />',
    '<rect x="0" y="0" width="320" height="140" rx="15" fill="url(#score-gradient)" stroke="#00e5ff" strokeWidth="2" filter="url(#glow-soft)" className="chart-center-box" />'
)
content = content.replace(
    '<rect x="-10" y="20" width="2" height="100" fill="#00e5ff" filter="url(#glow-soft)" />',
    '<rect x="-10" y="20" width="2" height="100" fill="#00e5ff" filter="url(#glow-soft)" className="chart-center-line-1" />'
)
content = content.replace(
    '<rect x="328" y="20" width="2" height="100" fill="#00e5ff" filter="url(#glow-soft)" />',
    '<rect x="328" y="20" width="2" height="100" fill="#00e5ff" filter="url(#glow-soft)" className="chart-center-line-2" />'
)

# Note: The viewBox may need slightly more room horizontally if outer labels expand.
content = content.replace(
    '<svg viewBox="0 0 1000 650" className="w-full h-full drop-shadow-2xl overflow-visible">',
    '<svg viewBox="0 0 1000 650" className="w-full h-full drop-shadow-2xl overflow-visible" style={{ padding: "0 20px" }}>'
)

with open('thrive/hope-survey.html', 'w') as f:
    f.write(content)

