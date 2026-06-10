import os
import re

files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/survey.html"
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Add renderQuestion() inside initVisual() if it's not there
        if "renderQuestion();" not in content.split("function initVisual()")[1].split("}")[0]:
            content = content.replace("visualInitialized = true;", "visualInitialized = true;\\n            renderQuestion();")
            
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
