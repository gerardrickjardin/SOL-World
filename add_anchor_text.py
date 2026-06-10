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
        
    # We want to add anchor text rendering in HopeSlider.
    # Look for the rating display section in HopeSlider.
    rating_display = """            {/* Rating Display */}
            <div className="rating-display-box mt-4">
                <div className="rating-label">YOUR RATING</div>
                <div className="rating-value">
                    <span className="number-val">{displayValue > 0 ? displayValue.toFixed(1) : "-.-"}</span> 
                    <span className="star-icon">⭐</span>
                </div>
            </div>"""

    new_rating_display = """            {/* Rating Display */}
            <div className="rating-display-box mt-4 flex flex-col items-center">
                <div className="rating-label">YOUR RATING</div>
                <div className="rating-value">
                    <span className="number-val">{displayValue > 0 ? displayValue.toFixed(1) : "-.-"}</span> 
                    <span className="star-icon">⭐</span>
                </div>
                {currentQ.anchors && currentQ.anchors[displayValue.toFixed(1)] && (
                    <div className="mt-4 p-4 bg-blue-50/80 rounded-xl border border-blue-200 text-sm md:text-base text-slate-700 font-medium italic shadow-sm max-w-xl mx-auto transition-all animate-fade-in">
                        "{currentQ.anchors[displayValue.toFixed(1)]}"
                    </div>
                )}
            </div>"""
            
    if rating_display in content:
        content = content.replace(rating_display, new_rating_display)
        with open(filepath, 'w', encoding="utf-8") as f:
            f.write(content)
        print(f"Updated HopeSlider anchor text in {filepath}")
    else:
        print(f"Rating display not found in {filepath}")

