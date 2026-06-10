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
    #                 {currentQ.anchors && currentQ.anchors[displayValue.toFixed(1)] && (
    #                     <div className="mt-4 p-4 bg-blue-50/80 rounded-xl border border-blue-200 text-sm md:text-base text-slate-700 font-medium italic shadow-sm max-w-xl mx-auto transition-all animate-fade-in">
    #                         "{currentQ.anchors[displayValue.toFixed(1)]}"
    #                     </div>
    #                 )}
    
    old_display = """                {currentQ.anchors && currentQ.anchors[displayValue.toFixed(1)] && (
                    <div className="mt-4 p-4 bg-blue-50/80 rounded-xl border border-blue-200 text-sm md:text-base text-slate-700 font-medium italic shadow-sm max-w-xl mx-auto transition-all animate-fade-in">
                        "{currentQ.anchors[displayValue.toFixed(1)]}"
                    </div>
                )}"""
                
    new_display = """                {currentQ.anchors && currentQ.anchors[displayValue.toFixed(1)] && (() => {
                    const fullText = currentQ.anchors[displayValue.toFixed(1)];
                    const match = fullText.match(/\\(([^)]+)\\)/);
                    const mainWord = match ? match[1] : fullText.split(':')[0].replace(/\\d\\s*Stars?/, '').trim();
                    return (
                        <div className="mt-4 px-6 py-2 bg-blue-50/80 rounded-full border border-blue-200 text-lg md:text-xl text-blue-800 font-bold tracking-wide shadow-sm mx-auto transition-all animate-fade-in uppercase">
                            {mainWord}
                        </div>
                    );
                })()}"""
                
    if old_display in content:
        content = content.replace(old_display, new_display)
        with open(filepath, 'w', encoding="utf-8") as f:
            f.write(content)
        print(f"Updated HopeSlider anchor text display in {filepath}")
    else:
        print(f"Old display not found in {filepath}")

