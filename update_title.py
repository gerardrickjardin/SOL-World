import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# Replace title
content = content.replace(
    'title: "🏠 1.1 Home Experience",',
    'title: "🏠 1.1 Home",\n        subtitle: "the physical structure where you sleep, eat, and spend most of your time",'
)

# Replace the heading rendering
old_heading = '<h2 className="font-black text-slate-900 text-3xl md:text-4xl tracking-tight leading-tight mb-5">{q.title}</h2>'
new_heading = """<h2 className="font-black text-slate-900 text-3xl md:text-4xl tracking-tight leading-tight mb-1">{q.title}</h2>
                            {q.subtitle && <p className="text-slate-500 font-medium text-[15px] mb-5">{q.subtitle}</p>}"""

content = content.replace(old_heading, new_heading)

with open(file_path, "w") as f:
    f.write(content)

print("Updated title and subtitle")
