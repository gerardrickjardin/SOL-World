import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# Fix 1: getGlowStyles - remove the glowing shadow from the "whole bar"
old_glow = """    const getGlowStyles = (zone) => {
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
    };"""

new_glow = """    const getGlowStyles = (zone) => {
        if (zone === 1) {
            return displayValue >= 1.0 && displayValue < 3.0 ? "border-blue-500/30" : "opacity-50 grayscale border-transparent";
        }
        if (zone === 3) {
            return displayValue === 3.0 ? "border-white/20" : "opacity-50 grayscale border-transparent";
        }
        if (zone === 5) {
            return displayValue > 3.0 ? "border-purple-500/30" : "opacity-50 grayscale border-transparent";
        }
        return "";
    };"""

content = content.replace(old_glow, new_glow)


# Fix 2: Labels and Circle placement
old_slider_area = """            {/* Range Slider */}
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
            </div>"""

new_slider_area = """            {/* Range Slider */}
            <div className="mt-10 mb-4 px-2 w-full flex flex-col gap-4">
                <div className="relative w-full h-1.5">
                    <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="0.5" 
                        value={displayValue}
                        onChange={(e) => handleSelect(parseFloat(e.target.value))}
                        onMouseEnter={() => setHoverValue(val)}
                        onMouseLeave={() => setHoverValue(null)}
                        className="w-full h-1.5 bg-gradient-to-r from-blue-600 via-slate-500 to-purple-600 rounded-lg appearance-none cursor-pointer outline-none absolute top-0 left-0 z-10"
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
                </div>
                
                {/* Labels under slider */}
                <div className="flex justify-between text-slate-500 text-[10px] uppercase tracking-wider" style={{ fontFamily: '"Sofia Pro Soft", "Sofia Pro", sans-serif', letterSpacing: '0.1em' }}>
                    <span className="text-left font-bold text-[#455568]">1.0<br/><span className="text-slate-600 font-medium">WORST</span></span>
                    <span className="text-center font-bold text-[#455568]">3.0<br/><span className="text-slate-600 font-medium">CURRENT</span></span>
                    <span className="text-right font-bold text-[#455568]">5.0<br/><span className="text-slate-600 font-medium">BEST</span></span>
                </div>
            </div>"""

content = content.replace(old_slider_area, new_slider_area)

# Fix 3: Font family for labels under emojis
# [shithole], [stable], [sanctuary]
content = content.replace('className={`font-mono text-sm tracking-widest ${getZoneColor(1)}`}', 'className={`text-sm tracking-widest ${getZoneColor(1)}`} style={{ fontFamily: \'"Sofia Pro Soft", "Sofia Pro", sans-serif\', fontWeight: 600 }}')
content = content.replace('className={`font-mono text-sm tracking-widest ${getZoneColor(3)}`}', 'className={`text-sm tracking-widest ${getZoneColor(3)}`} style={{ fontFamily: \'"Sofia Pro Soft", "Sofia Pro", sans-serif\', fontWeight: 600 }}')
content = content.replace('className={`font-mono text-sm tracking-widest ${getZoneColor(5)}`}', 'className={`text-sm tracking-widest ${getZoneColor(5)}`} style={{ fontFamily: \'"Sofia Pro Soft", "Sofia Pro", sans-serif\', fontWeight: 600 }}')

with open(file_path, "w") as f:
    f.write(content)
print("Updated successfully")
