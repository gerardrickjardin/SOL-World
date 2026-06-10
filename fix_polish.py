import re
import os

files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/hope-survey.html"
]

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding="utf-8") as f:
        content = f.read()

    # The current anchor display code is:
    old_display = """            {/* Rating Display */}
            <div className="rating-display-box mt-4 flex flex-col items-center">
                <div className="rating-label">YOUR RATING</div>
                <div className="rating-value">
                    <span className="number-val">{displayValue > 0 ? displayValue.toFixed(1) : "-.-"}</span> 
                    <span className="star-icon">⭐</span>
                </div>
                {currentQ.anchors && currentQ.anchors[displayValue.toFixed(1)] && (() => {
                    const fullText = currentQ.anchors[displayValue.toFixed(1)];
                    const match = fullText.match(/\\(([^)]+)\\)/);
                    const mainWord = match ? match[1] : fullText.split(':')[0].replace(/\\d\\s*Stars?/, '').trim();
                    return (
                        <div className="mt-4 px-6 py-2 bg-blue-50/80 rounded-full border border-blue-200 text-lg md:text-xl text-blue-800 font-bold tracking-wide shadow-sm mx-auto transition-all animate-fade-in uppercase">
                            {mainWord}
                        </div>
                    );
                })()}
            </div>"""
                
    new_display = """            {/* Rating Display */}
            <div className="rating-display-box mt-4">
                <div className="rating-label">YOUR RATING</div>
                <div className="rating-value">
                    <span className="number-val">{displayValue > 0 ? displayValue.toFixed(1) : "-.-"}</span> 
                    <span className="star-icon">⭐</span>
                </div>
            </div>

            <div className="h-16 mt-4 flex items-center justify-center pointer-events-none">
                {currentQ.anchors && currentQ.anchors[displayValue.toFixed(1)] && (() => {
                    const fullText = currentQ.anchors[displayValue.toFixed(1)];
                    const match = fullText.match(/\\(([^)]+)\\)/);
                    const mainWord = match ? match[1] : fullText.split(':')[0].replace(/\\d\\s*Stars?/, '').trim();
                    return (
                        <div className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-lg md:text-xl text-white font-black tracking-[0.2em] shadow-[0_5px_15px_rgba(0,229,255,0.4)] transition-all animate-fade-in uppercase whitespace-nowrap">
                            {mainWord}
                        </div>
                    );
                })()}
            </div>"""
                
    if old_display in content:
        content = content.replace(old_display, new_display)
        with open(filepath, 'w', encoding="utf-8") as f:
            f.write(content)
        print(f"Updated HopeSlider anchor text display in {filepath}")
    else:
        print(f"Old display not found in {filepath}")

