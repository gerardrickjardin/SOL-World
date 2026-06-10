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
        
    # Replace default fallbacks for currentSelection
    content = content.replace('? currentSelection : 3.0', '? currentSelection : 0.0')
    content = content.replace('?? 3.0', '?? null') # Use null for set state so we know it's untouched
    
    # In handleNextQ, it does `val !== undefined ? val : (currentSelection !== null ? currentSelection : 3.0)`
    content = content.replace('currentSelection !== null ? currentSelection : 3.0', 'currentSelection !== null ? currentSelection : 0.0')

    # Also handle HopeSlider val initialization:
    # it might have become `const val = currentSelection !== null ? currentSelection : 0.0;`
    # Let's ensure if displayValue is 0, it renders nicely
    content = content.replace('{displayValue.toFixed(1)}', '{displayValue > 0 ? displayValue.toFixed(1) : "-.-"}')

    with open(filepath, 'w', encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed defaults in {filepath}")

