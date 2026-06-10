import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

target_start = '<div className="grid grid-cols-3 gap-6 md:gap-8 relative z-10">'
target_end = '{/* Range Slider */}'

start_idx = content.find(target_start)
end_idx = content.find(target_end)

if start_idx == -1 or end_idx == -1:
    print("Could not find targets")
    sys.exit(1)

new_grid = """<div className="grid grid-cols-3 gap-6 md:gap-8 relative z-10">
                {/* 1.0 Zone */}
                <div className="flex flex-col items-center text-center gap-4 relative h-full">
                    <div className="flex-1 flex items-end justify-center min-h-[110px]">
                        <p className={`text-[12px] md:text-sm leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 1.0 && snappedValue <= 2.0 ? "text-blue-700 font-bold" : "text-slate-500 font-medium"}`}>
                            "...{shitholeData.desc.replace(/My .*? is /, '')}"
                        </p>
                    </div>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-blue-50 border border-blue-100 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full shrink-0 ${getGlowStyles(1)}`}>
                        {renderEmoji(1, 0, emojis["1.0"][0], 1.0)}
                        {renderEmoji(1, 1, emojis["1.0"][1], 1.5)}
                        {renderEmoji(1, 2, emojis["1.0"][2], 2.0)}
                    </div>
                    <span className={`text-sm tracking-widest ${getZoneColor(1)}`} style={{ fontFamily: '"Sofia Pro Soft", "Sofia Pro", sans-serif', fontWeight: 600 }}>[{shitholeData.title}]</span>
                </div>

                {/* 3.0 Zone */}
                <div className="flex flex-col items-center text-center gap-4 relative h-full">
                    <div className="flex-1 flex items-end justify-center min-h-[110px]">
                        <p className={`text-[12px] md:text-sm leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 2.5 && snappedValue <= 3.5 ? "text-slate-800 font-bold" : "text-slate-500 font-medium"}`}>
                            "...{stableData.desc.replace(/My .*? is /, '')}"
                        </p>
                    </div>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-slate-100 border border-slate-200 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full shrink-0 ${getGlowStyles(3)}`}>
                        {renderEmoji(3, 0, emojis["3.0"][0], 2.5)}
                        {renderEmoji(3, 1, emojis["3.0"][1], 3.0)}
                        {renderEmoji(3, 2, emojis["3.0"][2], 3.5)}
                    </div>
                    <span className={`text-sm tracking-widest ${getZoneColor(3)}`} style={{ fontFamily: '"Sofia Pro Soft", "Sofia Pro", sans-serif', fontWeight: 600 }}>[{stableData.title}]</span>
                </div>

                {/* 5.0 Zone */}
                <div className="flex flex-col items-center text-center gap-4 relative h-full">
                    <div className="flex-1 flex items-end justify-center min-h-[110px]">
                        <p className={`text-[12px] md:text-sm leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 4.0 && snappedValue <= 5.0 ? "text-purple-700 font-bold" : "text-slate-500 font-medium"}`}>
                            "...{sanctuaryData.desc.replace(/My .*? is /, '')}"
                        </p>
                    </div>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-purple-50 border border-purple-100 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full shrink-0 ${getGlowStyles(5)}`}>
                        {renderEmoji(5, 0, emojis["5.0"][0], 4.0)}
                        {renderEmoji(5, 1, emojis["5.0"][1], 4.5)}
                        {renderEmoji(5, 2, emojis["5.0"][2], 5.0)}
                    </div>
                    <span className={`text-sm tracking-widest ${getZoneColor(5)}`} style={{ fontFamily: '"Sofia Pro Soft", "Sofia Pro", sans-serif', fontWeight: 600 }}>[{sanctuaryData.title}]</span>
                </div>
            </div>

            """

content = content[:start_idx] + new_grid + content[end_idx:]

with open(file_path, "w") as f:
    f.write(content)

print("Fixed JSX Syntax Error in grid")
