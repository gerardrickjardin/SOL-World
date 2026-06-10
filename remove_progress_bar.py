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
        
        # Remove the HTML for the progress bar
        html_to_remove = """                            <!-- Progress Bar -->
                            <div class="w-full bg-slate-100 rounded-full h-3 mb-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] border border-slate-200/60 overflow-hidden">
                                <div id="survey-progress-bar" class="bg-blue-600 h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm smooth-gradient-bar relative flex items-center justify-end pr-[2px]" style="width: 5%">
                                    <div class="w-2 h-2 bg-white rounded-full shadow-[0_0_12px_4px_rgba(6,182,212,0.9)] animate-pulse"></div>
                                </div>
                            </div>"""
        
        content = content.replace(html_to_remove, "")
        
        # Remove JS updating the progress bar width
        js_to_remove = "document.getElementById('survey-progress-bar').style.width = ((currentQ + 1) / 20 * 100) + '%';"
        content = content.replace(js_to_remove, "")
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Removed progress bar from {filepath}")
