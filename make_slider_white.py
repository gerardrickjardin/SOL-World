import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# 1. Remove the concept box
old_concept = """                            <div className="bg-slate-50 border-y border-r border-slate-100 border-l-[6px] border-l-blue-600 rounded-2xl p-6 md:p-8 shadow-sm w-full">
                                <p className="text-slate-800 leading-relaxed font-bold text-lg md:text-xl">{q.concept}</p>
                            </div>"""

if old_concept in content:
    content = content.replace(old_concept, "")

# 2. Update the HopeEmojiSlider wrapper styling
old_slider_wrapper = """<div className="w-full flex flex-col gap-10 bg-[#15191e] p-8 md:p-10 rounded-3xl mb-6 shadow-2xl border border-slate-800 relative">"""
new_slider_wrapper = """<div className="w-full flex flex-col gap-10 bg-white p-8 md:p-10 rounded-3xl mb-6 shadow-xl border border-slate-200 relative">"""
if old_slider_wrapper in content:
    content = content.replace(old_slider_wrapper, new_slider_wrapper)

# 3. Update title color inside HopeEmojiSlider
old_slider_title = """<h3 className="text-emerald-400/90 text-2xl font-medium text-center mb-4 relative z-10">"""
new_slider_title = """<h3 className="text-emerald-700 text-2xl font-bold text-center mb-4 relative z-10">"""
if old_slider_title in content:
    content = content.replace(old_slider_title, new_slider_title)

# 4. Update the paragraph inactive/active colors for zone 1
old_zone1_p = """<p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 1.0 && snappedValue <= 2.0 ? "text-blue-200" : "text-slate-400"}`}>"""
new_zone1_p = """<p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 1.0 && snappedValue <= 2.0 ? "text-blue-700 font-bold" : "text-slate-500 font-medium"}`}>"""
if old_zone1_p in content:
    content = content.replace(old_zone1_p, new_zone1_p)

# 5. Update the paragraph inactive/active colors for zone 3
old_zone3_p = """<p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 2.5 && snappedValue <= 3.5 ? "text-slate-200" : "text-slate-400"}`}>"""
new_zone3_p = """<p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 2.5 && snappedValue <= 3.5 ? "text-slate-800 font-bold" : "text-slate-500 font-medium"}`}>"""
if old_zone3_p in content:
    content = content.replace(old_zone3_p, new_zone3_p)

# 6. Update the paragraph inactive/active colors for zone 5
old_zone5_p = """<p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 4.0 && snappedValue <= 5.0 ? "text-purple-200" : "text-slate-400"}`}>"""
new_zone5_p = """<p className={`text-[12px] md:text-sm h-12 leading-relaxed max-w-[200px] transition-colors duration-300 ${snappedValue >= 4.0 && snappedValue <= 5.0 ? "text-purple-700 font-bold" : "text-slate-500 font-medium"}`}>"""
if old_zone5_p in content:
    content = content.replace(old_zone5_p, new_zone5_p)

# 7. Update getZoneColor bottom labels
old_get_zone_color = """    const getZoneColor = (zone) => {
        if (zone === 1) return "text-blue-300";
        if (zone === 3) return "text-slate-300";
        if (zone === 5) return "text-purple-300";
        return "text-slate-400";
    }"""
new_get_zone_color = """    const getZoneColor = (zone) => {
        if (zone === 1) return "text-blue-600";
        if (zone === 3) return "text-slate-500";
        if (zone === 5) return "text-purple-600";
        return "text-slate-500";
    }"""
if old_get_zone_color in content:
    content = content.replace(old_get_zone_color, new_get_zone_color)

with open(file_path, "w") as f:
    f.write(content)

print("Updated successfully")
