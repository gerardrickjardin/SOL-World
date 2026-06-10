import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# Fix 1: Reduce the huge gap
old_wrapper = 'w-full flex flex-col gap-10 bg-white p-8 md:p-10 rounded-3xl mb-6 shadow-xl border border-slate-200 relative'
new_wrapper = 'w-full flex flex-col gap-6 bg-white p-8 md:p-10 rounded-3xl mb-6 shadow-xl border border-slate-200 relative'
content = content.replace(old_wrapper, new_wrapper)

# Fix 2: Change items-end to items-start so text aligns neatly at the top
old_text_wrapper = 'flex-1 flex items-end justify-center min-h-[110px]'
new_text_wrapper = 'flex-1 flex items-start justify-center min-h-[110px] mt-2'
content = content.replace(old_text_wrapper, new_text_wrapper)

with open(file_path, "w") as f:
    f.write(content)

print("Updated spacing and alignment successfully")
