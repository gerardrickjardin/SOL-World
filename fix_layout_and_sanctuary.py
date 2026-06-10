import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# Replace Zone 5 (Sanctuary) background to violet/purple
old_zone5_bg = "bg-orange-50/80 border border-orange-200/50 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(5)}"
new_zone5_bg = "bg-purple-50 border border-purple-100 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(5)}"
if old_zone5_bg in content:
    content = content.replace(old_zone5_bg, new_zone5_bg)

# Update layout of Zone 1
old_zone1_layout = """                {/* 1.0 Zone */}
                <div className="flex flex-col items-center text-center gap-6 relative">
                    <p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 1.0 && snappedValue <= 2.0 ? "text-blue-700 font-bold" : "text-slate-500 font-medium"}`}>
                        "...{shitholeData.desc.replace(/My .*? is /, '')}"
                    </p>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-blue-50 border border-blue-100 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(1)}`}>"""

new_zone1_layout = """                {/* 1.0 Zone */}
                <div className="flex flex-col items-center text-center gap-4 relative h-full">
                    <div className="flex-1 flex items-end justify-center min-h-[110px]">
                        <p className={`text-[12px] md:text-sm leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 1.0 && snappedValue <= 2.0 ? "text-blue-700 font-bold" : "text-slate-500 font-medium"}`}>
                            "...{shitholeData.desc.replace(/My .*? is /, '')}"
                        </p>
                    </div>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-blue-50 border border-blue-100 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full shrink-0 ${getGlowStyles(1)}`}>"""

if old_zone1_layout in content:
    content = content.replace(old_zone1_layout, new_zone1_layout)

# Update layout of Zone 3
old_zone3_layout = """                {/* 3.0 Zone */}
                <div className="flex flex-col items-center text-center gap-6 relative">
                    <p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 2.5 && snappedValue <= 3.5 ? "text-slate-800 font-bold" : "text-slate-500 font-medium"}`}>
                        "...{stableData.desc.replace(/My .*? is /, '')}"
                    </p>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-slate-100 border border-slate-200 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(3)}`}>"""

new_zone3_layout = """                {/* 3.0 Zone */}
                <div className="flex flex-col items-center text-center gap-4 relative h-full">
                    <div className="flex-1 flex items-end justify-center min-h-[110px]">
                        <p className={`text-[12px] md:text-sm leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 2.5 && snappedValue <= 3.5 ? "text-slate-800 font-bold" : "text-slate-500 font-medium"}`}>
                            "...{stableData.desc.replace(/My .*? is /, '')}"
                        </p>
                    </div>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-slate-100 border border-slate-200 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full shrink-0 ${getGlowStyles(3)}`}>"""

if old_zone3_layout in content:
    content = content.replace(old_zone3_layout, new_zone3_layout)


# Update layout of Zone 5
old_zone5_layout = """                {/* 5.0 Zone */}
                <div className="flex flex-col items-center text-center gap-6 relative">
                    <p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 4.0 && snappedValue <= 5.0 ? "text-purple-700 font-bold" : "text-slate-500 font-medium"}`}>
                        "...{sanctuaryData.desc.replace(/My .*? is /, '')}"
                    </p>
                    <div className={`flex items-center justify-center gap-1 md:gap-2 bg-purple-50 border border-purple-100 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(5)}`}>"""

# Wait, the string to replace uses the NEW zone5 background from above if we replaced it already.
# Oh, we didn't replace it if we use the old_zone5_layout which contains the new background inside it.
# Let's just use regex or replace the `<div className="flex flex-col items-center...` part.

import re

# We will just replace the paragraph wrapper for all three zones using regex
def replace_zone(content, zone_idx, color_text):
    pattern = r'<div className="flex flex-col items-center text-center gap-6 relative">\s*<p className={`text-\[12px\] md:text-sm h-12 leading-relaxed max-w-\[200px\] transition-colors duration-300 \$\{snappedValue [^\}]+\}`}>\s*"\.\.\.\{([^}]+)\}"\s*</p>\s*<div className={`flex items-center justify-center gap-1 md:gap-2 ([^`]+) rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full \$\{getGlowStyles\([^}]+\)\}`>}'
    
    # We will just replace it via simpler string replacements since regex with jsx can be tricky
    return content

content = content.replace('gap-6 relative"', 'gap-4 relative h-full"')
content = content.replace('h-12 leading-relaxed max-w-[200px]', 'leading-relaxed max-w-[200px]')
# Now inject the flex wrapper around the <p>
content = content.replace('<p className={`text-[12px]', '<div className="flex-1 flex items-end justify-center min-h-[110px]"><p className={`text-[12px]')
content = content.replace('"\n                    </p>', '"\n                    </p></div>')
content = content.replace('transition-all duration-500 w-full', 'transition-all duration-500 w-full shrink-0')


with open(file_path, "w") as f:
    f.write(content)

print("Updated sanctuary background and fixed layout to prevent overlapping")
