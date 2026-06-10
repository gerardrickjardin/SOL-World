import os
import re

files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL World/thrive/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/survey.html"
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding="utf-8") as f:
        content = f.read()
    
    # Update default selection from 2.5 to 3.0 in handleNextQ, handleBack, and start button
    content = content.replace('?? 2.5', '?? 3.0')
    
    # Update totalScore percentage math. 
    # original: {Math.round(totalScore)}
    # it should be {Math.round(((totalScore - 20) / 80) * 100)}
    content = re.sub(r'\{Math\.round\(totalScore\)\}', '{Math.round(((totalScore - 20) / 80) * 100)}', content)
    
    # We should also ensure the averageStar display is calculated properly if it exists.
    # I didn't see averageStar, but just in case.

    with open(filepath, 'w', encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {filepath}")
