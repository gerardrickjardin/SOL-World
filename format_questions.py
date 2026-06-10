import os
import re

files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/survey.html"
]

def reformat_text(match):
    full_text = match.group(1)
    # The text always starts with "How often do you "
    if full_text.startswith("How often do you "):
        rest_of_text = full_text[len("How often do you "):]
        rest_of_text = rest_of_text[0].lower() + rest_of_text[1:]
        new_text = f"""<span class=\\"font-bold block mb-3\\">How often do you...</span>{rest_of_text}"""
        return f'text: "{new_text}"'
    return match.group(0)

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Change innerText to innerHTML for question-text
        content = content.replace("document.getElementById('question-text').innerText = q.text;", "document.getElementById('question-text').innerHTML = q.text;")
        
        # Replace the text content of questions
        content = re.sub(r'text:\s*"([^"]+)"', reformat_text, content)
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Formatted {filepath}")
