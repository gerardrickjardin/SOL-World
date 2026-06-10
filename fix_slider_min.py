import os

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
    
    content = content.replace('min="0" max="5"', 'min="1" max="5"')
    content = content.replace('currentSelection !== null ? currentSelection : 2.5', 'currentSelection !== null ? currentSelection : 3.0')
    content = content.replace('currentSelection !== null ? currentSelection : 0', 'currentSelection !== null ? currentSelection : 3.0')

    with open(filepath, 'w', encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {filepath}")
