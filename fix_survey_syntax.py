import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# Fix the double comma syntax error
if ",," in content:
    content = content.replace(",,", ",")

# Fix the Flex 2 Psychological Safety title and concept
old_flex2 = 'title: "Flex 2: Psychological Safety Score (PSS)",\n        concept: "How would you rate your emotional and physical safety?",'
new_flex2 = 'title: "Flex 2: Psychological Safety",\n        subtitle: "your emotional and physical safety in your daily life",'
if old_flex2 in content:
    content = content.replace(old_flex2, new_flex2)

with open(file_path, "w") as f:
    f.write(content)

print("Syntax error fixed and Flex 2 updated.")
