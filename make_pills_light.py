import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# Replace pill backgrounds
content = content.replace(
    'bg-[#1e2532] rounded-full',
    'bg-slate-50 border border-slate-100 rounded-full'
)

content = content.replace(
    'bg-[#2a2e35] rounded-full',
    'bg-slate-50 border border-slate-100 rounded-full'
)

content = content.replace(
    'bg-[#2a1b3d] rounded-full',
    'bg-slate-50 border border-slate-100 rounded-full'
)

with open(file_path, "w") as f:
    f.write(content)

print("Updated pill backgrounds to light grey-ish")
