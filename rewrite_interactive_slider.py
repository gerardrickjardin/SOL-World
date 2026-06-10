import sys
import re

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# Define the old block exact string (from our previous rewrite)
target_start = "const HopeEmojiSlider = ({ currentSelection, onSelect, anchors, currentQ }) => {"
target_end = """        </div>
    );
};"""

start_idx = content.find(target_start)
end_idx = content.find(target_end, start_idx) + len(target_end)

if start_idx == -1 or end_idx == -1:
    print("Could not find the target component!")
    sys.exit(1)

new_component = r"""const HopeEmojiSlider = ({ currentSelection, onSelect, anchors, currentQ }) => {
    const [hoverValue, setHoverValue] = window.React.useState(null);
    const [hoverEmoji, setHoverEmoji] = window.React.useState(null);
    
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
            return displayValue >= 1.0 && displayValue < 3.0 ? "shadow-[0_0_25px_rgba(59,130,246,0.5)] border-blue-500/50" : "opacity-60 grayscale border-transparent";
        }
        if (zone === 3) {
            return displayValue === 3.0 ? "shadow-[0_0_25px_rgba(255,255,255,0.4)] border-white/40" : "opacity-60 grayscale border-transparent";
        }
        if (zone === 5) {
            return displayValue > 3.0 ? "shadow-[0_0_25px_rgba(168,85,247,0.5)] border-purple-500/50" : "opacity-60 grayscale border-transparent";
        }
        return "";
    };
    
    const getZoneColor = (zone) => {
        if (zone === 1) return "text-blue-300";
        if (zone === 3) return "text-slate-300";
        if (zone === 5) return "text-purple-300";
        return "text-slate-400";
    }

    const renderEmoji = (zone, index, emojiStr, valueToSelect) => {
        const isHovered = hoverEmoji === `${zone}-${index}`;
        const isSelected = displayValue === valueToSelect;
        
        let scaleClass = "scale-100 translate-y-0";
        let ringClass = "";
        
        if (isHovered) {
            scaleClass = "scale-150 -translate-y-2 z-30 brightness-125";
        } else if (hoverEmoji) {
            const [hZone, hIdx] = hoverEmoji.split('-');
            if (parseInt(hZone) === zone && Math.abs(parseInt(hIdx) - index) === 1) {
                scaleClass = "scale-125 -translate-y-1 z-20 brightness-110";
            }
        } else if (isSelected && index === 1) {
             scaleClass = "scale-125 z-20";
        }
        
        if (isSelected && index === 1) {
             ringClass = zone === 1 ? "ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" : 
                         zone === 3 ? "ring-2 ring-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.8)]" : 
                         "ring-2 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]";
        }

        return (
            <div 
                className={`relative rounded-full p-2 md:p-3 transition-all duration-300 ease-out cursor-pointer ${scaleClass} ${ringClass}`}
                onMouseEnter={() => setHoverEmoji(`${zone}-${index}`)}
                onMouseLeave={() => setHoverEmoji(null)}
                onClick={() => handleSelect(valueToSelect)}
            >
                <span className="text-2xl md:text-4xl drop-shadow-lg filter">{emojiStr}</span>
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col gap-10 bg-[#15191e] p-8 md:p-10 rounded-3xl mb-6 shadow-2xl border border-slate-800">
            <h3 className="text-emerald-400/90 text-2xl font-medium text-center mb-4">
                "My {currentQ.title.replace(/[\u{1F300}-\u{1F9FF}]|\d\.\d/gu, '').trim().toLowerCase()} experience..."
            </h3>
            
            <div className="grid grid-cols-3 gap-6 md:gap-8">
                {/* 1.0 Zone */}
                <div className="flex flex-col items-center text-center gap-6 relative">
                    <p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${displayValue >= 1.0 && displayValue < 3.0 ? "text-blue-200" : "text-slate-400"}`}>
                        "...{shitholeData.desc.replace(/My .*? is /, '')}"
                    </p>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-[#1e2532] rounded-full px-2 md:px-4 py-2 border transition-all duration-500 w-full ${getGlowStyles(1)}`}>
                        {renderEmoji(1, 0, emojis["1.0"][0], 1.0)}
                        {renderEmoji(1, 1, emojis["1.0"][1], 1.0)}
                        {renderEmoji(1, 2, emojis["1.0"][2], 1.0)}
                    </div>
                    <span className={`font-mono text-sm tracking-widest ${getZoneColor(1)}`}>[{shitholeData.title}]</span>
                </div>

                {/* 3.0 Zone */}
                <div className="flex flex-col items-center text-center gap-6 relative">
                    <p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${displayValue === 3.0 ? "text-slate-200" : "text-slate-400"}`}>
                        "...{stableData.desc.replace(/My .*? is /, '')}"
                    </p>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-[#2a2e35] rounded-full px-2 md:px-4 py-2 border transition-all duration-500 w-full ${getGlowStyles(3)}`}>
                        {renderEmoji(3, 0, emojis["3.0"][0], 3.0)}
                        {renderEmoji(3, 1, emojis["3.0"][1], 3.0)}
                        {renderEmoji(3, 2, emojis["3.0"][2], 3.0)}
                    </div>
                    <span className={`font-mono text-sm tracking-widest ${getZoneColor(3)}`}>[{stableData.title}]</span>
                </div>

                {/* 5.0 Zone */}
                <div className="flex flex-col items-center text-center gap-6 relative">
                    <p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${displayValue > 3.0 ? "text-purple-200" : "text-slate-400"}`}>
                        "...{sanctuaryData.desc.replace(/My .*? is /, '')}"
                    </p>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-[#2a1b3d] rounded-full px-2 md:px-4 py-2 border transition-all duration-500 w-full ${getGlowStyles(5)}`}>
                        {renderEmoji(5, 0, emojis["5.0"][0], 5.0)}
                        {renderEmoji(5, 1, emojis["5.0"][1], 5.0)}
                        {renderEmoji(5, 2, emojis["5.0"][2], 5.0)}
                    </div>
                    <span className={`font-mono text-sm tracking-widest ${getZoneColor(5)}`}>[{sanctuaryData.title}]</span>
                </div>
            </div>

            {/* Range Slider */}
            <div className="relative mt-10 mb-4 px-2 w-full">
                <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="0.5" 
                    value={displayValue}
                    onChange={(e) => handleSelect(parseFloat(e.target.value))}
                    onMouseEnter={() => setHoverValue(val)}
                    onMouseLeave={() => setHoverValue(null)}
                    className="w-full h-1.5 bg-gradient-to-r from-blue-600 via-slate-500 to-purple-600 rounded-lg appearance-none cursor-pointer outline-none relative z-10"
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
                
                {/* Gliding Thumb Overlay */}
                <div 
                    className="absolute top-1/2 -translate-y-1/2 -ml-4 w-9 h-9 rounded-full border-[3px] border-white flex items-center justify-center text-white text-[12px] font-bold pointer-events-none z-20 shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{ 
                        left: `calc(0.5rem + ${((displayValue - 1) / 4) * 100}% - ${((displayValue - 1) / 4) * 1}rem)`,
                        backgroundColor: displayValue > 3 ? '#a855f7' : displayValue < 3 ? '#3b82f6' : '#64748b',
                        boxShadow: `0 0 20px ${displayValue > 3 ? '#a855f7' : displayValue < 3 ? '#3b82f6' : '#64748b'}`
                    }}
                >
                    {displayValue.toFixed(1)}
                </div>
                
                {/* Labels under slider */}
                <div className="flex justify-between text-slate-500 text-[10px] mt-4 uppercase font-bold tracking-wider">
                    <span>1.0<br/>Worst</span>
                    <span>3.0<br/>Current</span>
                    <span className="text-right">5.0<br/>Best</span>
                </div>
            </div>
        </div>
    );
};"""

content = content[:start_idx] + new_component + content[end_idx:]

with open(file_path, "w") as f:
    f.write(content)
print("Updated successfully")
