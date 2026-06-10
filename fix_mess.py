import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

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
    const [burstValue, setBurstValue] = window.React.useState(null);
    
    // Pro Slider State
    const [isDragging, setIsDragging] = window.React.useState(false);
    
    const val = currentSelection !== null ? currentSelection : 0.0;
    const [rawValue, setRawValue] = window.React.useState(val);

    // Sync rawValue with val when not dragging
    window.React.useEffect(() => {
        if (!isDragging && hoverValue === null) {
            setRawValue(val);
        }
    }, [val, isDragging, hoverValue]);

    const displayValue = hoverValue !== null ? hoverValue : rawValue;
    const snappedValue = Math.round(displayValue * 2) / 2;

    const triggerBurst = (rating) => {
        setBurstValue(rating);
        setTimeout(() => setBurstValue(null), 800);
    };

    const handleEmojiClick = (rating) => {
        setIsDragging(false);
        onSelect(rating);
        setRawValue(rating);
        triggerBurst(rating);
    };

    const handleSliderChange = (e) => {
        const v = parseFloat(e.target.value);
        setRawValue(v);
        const snapped = Math.round(v * 2) / 2;
        if (snapped !== val) {
            onSelect(snapped);
        }
    };

    const handleDragStart = () => setIsDragging(true);
    
    const handleDragEnd = () => {
        setIsDragging(false);
        const snapped = Math.round(rawValue * 2) / 2;
        setRawValue(snapped);
        onSelect(snapped);
        triggerBurst(snapped);
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
            return snappedValue >= 1.0 && snappedValue <= 2.0 ? "opacity-100 border-transparent" : "opacity-50 grayscale border-transparent";
        }
        if (zone === 3) {
            return snappedValue >= 2.5 && snappedValue <= 3.5 ? "opacity-100 border-transparent" : "opacity-50 grayscale border-transparent";
        }
        if (zone === 5) {
            return snappedValue >= 4.0 && snappedValue <= 5.0 ? "opacity-100 border-transparent" : "opacity-50 grayscale border-transparent";
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
        const isSelected = snappedValue === valueToSelect;
        const isBursting = burstValue === valueToSelect;
        
        let scaleClass = "scale-100 translate-y-0";
        let ringClass = "";
        
        if (isHovered) {
            scaleClass = "scale-150 -translate-y-2 z-30 brightness-125";
        } else if (hoverEmoji) {
            const [hZone, hIdx] = hoverEmoji.split('-');
            if (parseInt(hZone) === zone && Math.abs(parseInt(hIdx) - index) === 1) {
                scaleClass = "scale-125 -translate-y-1 z-20 brightness-110";
            }
        } else if (isSelected) {
             scaleClass = "scale-125 z-20";
        }
        
        if (isSelected) {
             ringClass = zone === 1 ? "ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" : 
                         zone === 3 ? "ring-2 ring-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.8)]" : 
                         "ring-2 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]";
        }

        return (
            <div 
                className={`relative rounded-full p-2 md:p-3 transition-all duration-300 ease-out cursor-pointer ${scaleClass} ${ringClass}`}
                onMouseEnter={() => setHoverEmoji(`${zone}-${index}`)}
                onMouseLeave={() => setHoverEmoji(null)}
                onClick={() => handleEmojiClick(valueToSelect)}
            >
                <span className="text-2xl md:text-4xl drop-shadow-lg filter relative z-10">{emojiStr}</span>
                {isBursting && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 z-0 pointer-events-none">
                        <span className="absolute text-xl" style={{ animation: 'burst1 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>{emojiStr}</span>
                        <span className="absolute text-xl" style={{ animation: 'burst2 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>{emojiStr}</span>
                        <span className="absolute text-xl" style={{ animation: 'burst3 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>{emojiStr}</span>
                        <span className="absolute text-xl" style={{ animation: 'burst4 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>{emojiStr}</span>
                    </div>
                )}
            </div>
        );
    };

    const thumbBgColor = snappedValue > 3 ? '#a855f7' : snappedValue < 3 ? '#3b82f6' : '#64748b';

    return (
        <div className="w-full flex flex-col gap-10 bg-[#15191e] p-8 md:p-10 rounded-3xl mb-6 shadow-2xl border border-slate-800 relative">
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes burst1 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-40px, -80px) scale(1.5) rotate(-25deg); opacity: 0; } }
                @keyframes burst2 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-10px, -100px) scale(1.8) rotate(-10deg); opacity: 0; } }
                @keyframes burst3 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(20px, -90px) scale(1.6) rotate(15deg); opacity: 0; } }
                @keyframes burst4 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(50px, -70px) scale(1.4) rotate(30deg); opacity: 0; } }
            `}} />

            <h3 className="text-emerald-400/90 text-2xl font-medium text-center mb-4 relative z-10">
                "My {currentQ.title.replace(/[\u{1F300}-\u{1F9FF}]|\d\.\d/gu, '').trim().toLowerCase()} experience..."
            </h3>
            
            <div className="grid grid-cols-3 gap-6 md:gap-8 relative z-10">
                {/* 1.0 Zone */}
                <div className="flex flex-col items-center text-center gap-6 relative">
                    <p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 1.0 && snappedValue <= 2.0 ? "text-blue-200" : "text-slate-400"}`}>
                        "...{shitholeData.desc.replace(/My .*? is /, '')}"
                    </p>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-[#1e2532] rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(1)}`}>
                        {renderEmoji(1, 0, emojis["1.0"][0], 1.0)}
                        {renderEmoji(1, 1, emojis["1.0"][1], 1.5)}
                        {renderEmoji(1, 2, emojis["1.0"][2], 2.0)}
                    </div>
                    <span className={`text-sm tracking-widest ${getZoneColor(1)}`} style={{ fontFamily: '"Sofia Pro Soft", "Sofia Pro", sans-serif', fontWeight: 600 }}>[{shitholeData.title}]</span>
                </div>

                {/* 3.0 Zone */}
                <div className="flex flex-col items-center text-center gap-6 relative">
                    <p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 2.5 && snappedValue <= 3.5 ? "text-slate-200" : "text-slate-400"}`}>
                        "...{stableData.desc.replace(/My .*? is /, '')}"
                    </p>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-[#2a2e35] rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(3)}`}>
                        {renderEmoji(3, 0, emojis["3.0"][0], 2.5)}
                        {renderEmoji(3, 1, emojis["3.0"][1], 3.0)}
                        {renderEmoji(3, 2, emojis["3.0"][2], 3.5)}
                    </div>
                    <span className={`text-sm tracking-widest ${getZoneColor(3)}`} style={{ fontFamily: '"Sofia Pro Soft", "Sofia Pro", sans-serif', fontWeight: 600 }}>[{stableData.title}]</span>
                </div>

                {/* 5.0 Zone */}
                <div className="flex flex-col items-center text-center gap-6 relative">
                    <p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 4.0 && snappedValue <= 5.0 ? "text-purple-200" : "text-slate-400"}`}>
                        "...{sanctuaryData.desc.replace(/My .*? is /, '')}"
                    </p>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-[#2a1b3d] rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(5)}`}>
                        {renderEmoji(5, 0, emojis["5.0"][0], 4.0)}
                        {renderEmoji(5, 1, emojis["5.0"][1], 4.5)}
                        {renderEmoji(5, 2, emojis["5.0"][2], 5.0)}
                    </div>
                    <span className={`text-sm tracking-widest ${getZoneColor(5)}`} style={{ fontFamily: '"Sofia Pro Soft", "Sofia Pro", sans-serif', fontWeight: 600 }}>[{sanctuaryData.title}]</span>
                </div>
            </div>

            {/* Range Slider */}
            <div className="mt-10 mb-2 px-2 w-full relative z-10">
                <div className="relative w-full h-12">
                    
                    {/* The Track */}
                    <div className="absolute w-full h-1.5 bg-gradient-to-r from-blue-600 via-slate-500 to-purple-600 rounded-lg pointer-events-none z-10" style={{ top: '50%', marginTop: '-3px' }}></div>
                    
                    {/* The Native Invisible Slider */}
                    <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="0.01" 
                        value={displayValue}
                        onChange={handleSliderChange}
                        onMouseDown={handleDragStart}
                        onMouseUp={handleDragEnd}
                        onTouchStart={handleDragStart}
                        onTouchEnd={handleDragEnd}
                        onMouseEnter={() => setHoverValue(val)}
                        onMouseLeave={() => setHoverValue(null)}
                        className="absolute w-full h-full opacity-0 cursor-pointer z-30"
                        style={{ top: 0, left: 0 }}
                    />
                    
                    {/* The Gliding Thumb Overlay */}
                    <div 
                        className={`absolute w-9 h-9 rounded-full border-[3px] border-white flex items-center justify-center text-white text-[12px] font-bold pointer-events-none z-20 ${isDragging ? '' : 'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]'}`}
                        style={{ 
                            top: '50%',
                            marginTop: '-18px',
                            left: `calc(${((displayValue - 1) / 4) * 100}% - ${((displayValue - 1) / 4) * 36}px)`,
                            backgroundColor: thumbBgColor,
                            boxShadow: `0 0 20px ${thumbBgColor}`,
                            transform: isDragging ? 'scale(1.15)' : 'scale(1)'
                        }}
                    >
                        {snappedValue.toFixed(1)}
                    </div>
                </div>
            </div>
        </div>
    );
};"""

content = content[:start_idx] + new_component + content[end_idx:]

with open(file_path, "w") as f:
    f.write(content)
print("Updated successfully")
