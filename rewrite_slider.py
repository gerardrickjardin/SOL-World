import sys
import re

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# The target we want to replace
target_component = """const HopeCardSelector = ({ currentSelection, onSelect, anchors }) => {
    const handleCardSelect = (val) => {
        onSelect(val);
    };

    const colorMap = {
        "5.0": {
            bg: "bg-emerald-50", border: "border-emerald-500", text: "text-emerald-900", desc: "text-emerald-800",
            hoverBg: "hover:bg-emerald-50/50", hoverBorder: "hover:border-emerald-300", 
            badgeBg: "bg-emerald-500 text-white", badgeHover: "group-hover:bg-emerald-100 group-hover:text-emerald-600",
            dot: "bg-emerald-500"
        },
        "3.0": {
            bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-900", desc: "text-blue-800",
            hoverBg: "hover:bg-blue-50/50", hoverBorder: "hover:border-blue-300", 
            badgeBg: "bg-blue-500 text-white", badgeHover: "group-hover:bg-blue-100 group-hover:text-blue-600",
            dot: "bg-blue-500"
        },
        "1.0": {
            bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-900", desc: "text-purple-800",
            hoverBg: "hover:bg-purple-50/50", hoverBorder: "hover:border-purple-300", 
            badgeBg: "bg-purple-500 text-white", badgeHover: "group-hover:bg-purple-100 group-hover:text-purple-600",
            dot: "bg-purple-500"
        }
    };

    return (
        <div className="flex flex-col justify-start gap-3 overflow-y-auto custom-scrollbar mt-4 mb-4">
            {["5.0", "3.0", "1.0"].map((scoreKey) => {
                const fullText = anchors && anchors[scoreKey];
                if (!fullText) return null;
                const match = fullText.match(/\(([^)]+)\)/);
                const title = match ? match[1] : fullText.split(':')[0].replace(/\d\s*Stars?/, '').trim();
                const desc = fullText.includes(':') ? fullText.split(':')[1].trim() : fullText;
                const numValue = parseFloat(scoreKey);
                const isSelected = currentSelection === numValue;
                const colors = colorMap[scoreKey];
                
                return (
                    <div 
                        key={scoreKey}
                        onClick={() => handleCardSelect(numValue)}
                        className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${isSelected ? `${colors.bg} ${colors.border} shadow-md scale-[1.02]` : `bg-white border-slate-200 ${colors.hoverBorder} ${colors.hoverBg}`}`}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isSelected ? colors.badgeBg : `bg-slate-100 text-slate-400 ${colors.badgeHover}`}`}>
                                    {scoreKey.charAt(0)}
                                </div>
                                <h3 className={`font-bold text-lg ${isSelected ? colors.text : 'text-slate-700'}`}>{title}</h3>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? colors.border : 'border-slate-300'}`}>
                                {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`}></div>}
                            </div>
                        </div>
                        
                        <p className={`text-sm leading-relaxed transition-all duration-300 ${isSelected ? colors.desc : 'text-slate-500 line-clamp-2 group-hover:line-clamp-none'}`}>
                            "{desc}"
                        </p>
                    </div>
                );
            })}
        </div>
    );
};"""

new_component = r"""const HopeEmojiSlider = ({ currentSelection, onSelect, anchors, currentQ }) => {
    const [hoverValue, setHoverValue] = window.React.useState(null);
    const val = currentSelection !== null ? currentSelection : 0.0;
    const displayValue = hoverValue !== null ? hoverValue : val;

    const handleSelect = (rating) => {
        onSelect(rating);
    };

    const getAnchorData = (key) => {
        const fullText = anchors && anchors[key];
        if (!fullText) return { title: '', desc: '' };
        const match = fullText.match(/\(([^)]+)\)/);
        const title = match ? match[1] : fullText.split(':')[0].replace(/\d\s*Stars?/, '').trim();
        const desc = fullText.includes(':') ? fullText.split(':')[1].trim() : fullText;
        return { title: title.toLowerCase(), desc };
    };

    const shitholeData = getAnchorData("1.0");
    const stableData = getAnchorData("3.0");
    const sanctuaryData = getAnchorData("5.0");

    const emojis = {
        "1.0": ["😢", "👎", "😟"],
        "3.0": ["😐", "👍", "🙂"],
        "5.0": ["👏", "💖", "🎉"]
    };

    const getGlowStyles = (zone) => {
        if (zone === 1) {
            return displayValue >= 1.0 && displayValue < 3.0 ? "shadow-[0_0_20px_rgba(59,130,246,0.6)] border-blue-400" : "opacity-50 grayscale border-transparent";
        }
        if (zone === 3) {
            return displayValue === 3.0 ? "shadow-[0_0_20px_rgba(255,255,255,0.8)] border-white/80" : "opacity-50 grayscale border-transparent";
        }
        if (zone === 5) {
            return displayValue > 3.0 ? "shadow-[0_0_20px_rgba(168,85,247,0.6)] border-purple-400" : "opacity-50 grayscale border-transparent";
        }
        return "";
    };

    return (
        <div className="w-full flex flex-col gap-6 bg-[#1e2329] p-6 rounded-2xl mb-4">
            <h3 className="text-emerald-400/90 text-xl font-medium text-center mb-2">
                "My {currentQ.title.replace(/[\u{1F300}-\u{1F9FF}]|\d\.\d/gu, '').trim().toLowerCase()} experience..."
            </h3>
            
            <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="flex flex-col items-center text-center gap-2">
                    <p className="text-cyan-200/80 text-[10px] md:text-xs h-10 leading-tight">"...{shitholeData.desc.replace(/My .*? is /, '')}"</p>
                    <div className={`flex items-center gap-1 md:gap-2 bg-slate-600/30 rounded-full px-2 md:px-4 py-1.5 md:py-2 border transition-all duration-300 ${getGlowStyles(1)}`}>
                        <span className="text-sm md:text-xl">{emojis["1.0"][0]}</span>
                        <div className="bg-slate-800 rounded-full p-1.5 md:p-2 border border-slate-600 shadow-inner">
                            <span className="text-xl md:text-3xl drop-shadow-md">{emojis["1.0"][1]}</span>
                        </div>
                        <span className="text-sm md:text-xl">{emojis["1.0"][2]}</span>
                    </div>
                    <span className="text-cyan-400 text-[10px] md:text-xs">[{shitholeData.title}]</span>
                </div>

                <div className="flex flex-col items-center text-center gap-2">
                    <p className="text-white/80 text-[10px] md:text-xs h-10 leading-tight">"...{stableData.desc.replace(/My .*? is /, '')}"</p>
                    <div className={`flex items-center gap-1 md:gap-2 bg-white/20 rounded-full px-2 md:px-4 py-1.5 md:py-2 border transition-all duration-300 ${getGlowStyles(3)}`}>
                        <span className="text-sm md:text-xl">{emojis["3.0"][0]}</span>
                        <div className="bg-slate-800 rounded-full p-1.5 md:p-2 border border-slate-600 shadow-inner">
                            <span className="text-xl md:text-3xl drop-shadow-md">{emojis["3.0"][1]}</span>
                        </div>
                        <span className="text-sm md:text-xl">{emojis["3.0"][2]}</span>
                    </div>
                    <span className="text-white text-[10px] md:text-xs">[{stableData.title}]</span>
                </div>

                <div className="flex flex-col items-center text-center gap-2">
                    <p className="text-purple-300/80 text-[10px] md:text-xs h-10 leading-tight">"...{sanctuaryData.desc.replace(/My .*? is /, '')}"</p>
                    <div className={`flex items-center gap-1 md:gap-2 bg-purple-900/40 rounded-full px-2 md:px-4 py-1.5 md:py-2 border transition-all duration-300 ${getGlowStyles(5)}`}>
                        <span className="text-sm md:text-xl">{emojis["5.0"][0]}</span>
                        <div className="bg-slate-800 rounded-full p-1.5 md:p-2 border border-slate-600 shadow-inner">
                            <span className="text-xl md:text-3xl drop-shadow-md">{emojis["5.0"][1]}</span>
                        </div>
                        <span className="text-sm md:text-xl">{emojis["5.0"][2]}</span>
                    </div>
                    <span className="text-purple-400 text-[10px] md:text-xs">[{sanctuaryData.title}]</span>
                </div>
            </div>

            <div className="relative mt-6 mb-2 mx-2">
                <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="0.5" 
                    value={displayValue}
                    onChange={(e) => handleSelect(parseFloat(e.target.value))}
                    onMouseEnter={() => setHoverValue(val)}
                    onMouseLeave={() => setHoverValue(null)}
                    className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer outline-none relative z-10"
                />
                <style dangerouslySetInnerHTML={{__html: `
                    input[type='range']::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 1px;
                        height: 1px;
                        background: transparent;
                        border: none;
                    }
                    input[type='range']::-moz-range-thumb {
                        width: 1px;
                        height: 1px;
                        background: transparent;
                        border: none;
                    }
                `}} />
                
                <div 
                    className="absolute top-1/2 -translate-y-1/2 -ml-3 w-8 h-8 rounded-full border-[3px] border-white flex items-center justify-center text-white text-[10px] font-bold pointer-events-none z-20 shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-colors"
                    style={{ 
                        left: `${((displayValue - 1) / 4) * 100}%`,
                        backgroundColor: displayValue > 3 ? '#581c87' : displayValue < 3 ? '#1e3a8a' : '#475569'
                    }}
                >
                    {displayValue.toFixed(1)}
                </div>
            </div>
        </div>
    );
};"""

target_usage = """                        <HopeCardSelector 
                            currentSelection={currentSelection} 
                            onSelect={(val) => {
                                setCurrentSelection(val);
                            }} 
                            anchors={q.anchors} 
                        />"""

new_usage = """                        <HopeEmojiSlider 
                            currentSelection={currentSelection} 
                            onSelect={(val) => {
                                setCurrentSelection(val);
                            }} 
                            anchors={q.anchors} 
                            currentQ={q}
                        />"""

content = content.replace(target_component, new_component)
content = content.replace(target_usage, new_usage)

with open(file_path, "w") as f:
    f.write(content)
print("Updated successfully")
