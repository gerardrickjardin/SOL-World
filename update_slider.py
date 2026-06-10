import re
import os

new_slider = """const HopeSlider = ({ currentSelection, setCurrentSelection, currentQ, onNext }) => {
    const val = currentSelection !== null ? currentSelection : 3.0;

    const handleStarClick = (rating) => {
        setCurrentSelection(rating);
        // Add a tiny delay before advancing so they can see the star fill up
        setTimeout(() => onNext(rating), 300);
    };

    return (
        <div className="hope-drag-container">
            <div className="flex justify-center items-center gap-2 md:gap-4 my-6">
                {[1, 2, 3, 4, 5].map(starIndex => {
                    const fillValue = val - starIndex + 1; // 1 if full, 0.5 if half, <=0 if empty
                    return (
                        <div key={starIndex} className="relative w-12 h-12 md:w-16 md:h-16 cursor-pointer touch-manipulation">
                            {/* Left Half Hitbox (0.5) */}
                            <div 
                                className="absolute left-0 top-0 w-1/2 h-full z-10"
                                onClick={() => handleStarClick(starIndex - 0.5)}
                            />
                            {/* Right Half Hitbox (1.0) */}
                            <div 
                                className="absolute right-0 top-0 w-1/2 h-full z-10"
                                onClick={() => handleStarClick(starIndex)}
                            />
                            
                            {/* Empty Star Base */}
                            <svg viewBox="0 0 24 24" className="w-full h-full text-slate-200 transition-colors">
                                <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                            
                            {/* Filled Star Overlay */}
                            {fillValue > 0 && (
                                <svg 
                                    viewBox="0 0 24 24" 
                                    className="absolute top-0 left-0 w-full h-full text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                                    style={{ clipPath: fillValue === 0.5 ? 'inset(0 50% 0 0)' : 'none' }}
                                >
                                    <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Rating Display */}
            <div className="rating-display-box mt-4">
                <div className="rating-label">YOUR RATING</div>
                <div className="rating-value">
                    <span className="number-val">{val.toFixed(1)}</span> 
                    <span className="star-icon">⭐</span>
                </div>
            </div>
        </div>
    );
};"""

files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/hope-survey.html"
]

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding="utf-8") as f:
        content = f.read()
        
    # Replace the component using regex to capture the whole block
    pattern = re.compile(r'const HopeSlider = \(\{ currentSelection, setCurrentSelection, currentQ, onNext \}\) => \{.*?^};', re.MULTILINE | re.DOTALL)
    
    if pattern.search(content):
        content = pattern.sub(new_slider, content)
        with open(filepath, 'w', encoding="utf-8") as f:
            f.write(content)
        print(f"Updated HopeSlider in {filepath}")
    else:
        print(f"HopeSlider not found in {filepath}")

