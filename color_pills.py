import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# Replace Zone 1 (Shithole) to light blue
old_zone1 = "bg-slate-50 border border-slate-100 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(1)}"
new_zone1 = "bg-blue-50 border border-blue-100 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(1)}"
content = content.replace(old_zone1, new_zone1)

# Replace Zone 3 (Stable) to light gray
old_zone3 = "bg-slate-50 border border-slate-100 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(3)}"
new_zone3 = "bg-slate-100 border border-slate-200 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(3)}"
content = content.replace(old_zone3, new_zone3)

# Replace Zone 5 (Sanctuary) to light brown
old_zone5 = "bg-slate-50 border border-slate-100 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(5)}"
new_zone5 = "bg-orange-50/80 border border-orange-200/50 rounded-full px-2 md:px-4 py-2 transition-all duration-500 w-full ${getGlowStyles(5)}"
content = content.replace(old_zone5, new_zone5)

with open(file_path, "w") as f:
    f.write(content)

print("Updated pill backgrounds to distinctive colors")
