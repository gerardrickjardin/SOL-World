import os

files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/survey.html"
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Fix the literal \n
        content = content.replace("visualInitialized = true;\\n            renderQuestion();", "visualInitialized = true;\n            renderQuestion();")
            
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
