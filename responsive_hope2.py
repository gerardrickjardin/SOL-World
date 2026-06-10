import re

with open('thrive/hope-survey.html', 'r') as f:
    content = f.read()

# Remove the injected style block completely to fix the "wonkiness"
style_block_pattern = r'<style>\s*\{`\s*@media \(max-width: 768px\).*?`\}\s*</style>'
content = re.sub(style_block_pattern, '', content, flags=re.DOTALL)

# Revert the classNames that we added for the CSS
content = content.replace('className="chart-dim-text"', '')
content = content.replace('className="chart-slice-text"', '')
content = content.replace('className="chart-score-title"', '')
content = content.replace('className="chart-score-subtitle"', '')
content = content.replace('className="chart-score-main"', '')
content = content.replace('className="chart-score-max"', '')
content = content.replace('className="chart-center-box"', '')
content = content.replace('className="chart-center-line-1"', '')
content = content.replace('className="chart-center-line-2"', '')

# Clean up multiple spaces that might have been left
content = re.sub(r'\s+className=""', '', content)
content = re.sub(r' +>', '>', content)
content = re.sub(r' +/>', ' />', content)

# To optimize for mobile nicely, we will change the aspect ratio on mobile to be taller
# Original: style={{ aspectRatio: "2/1.3" }}
# Replace with: className={`relative w-full shrink-0 mx-auto aspect-[1/1.2] md:aspect-[2/1.3] ...
chart_wrapper = r'<div className=\{`relative w-full shrink-0 mx-auto \$\{isFinal \? "lg:max-h-\[500px\]" : "lg:max-h-\[450px\]"}`\} style=\{\{ aspectRatio: "2/1\.3" \}\}>'
chart_wrapper_replacement = r'<div className={`relative w-full shrink-0 mx-auto aspect-[1/1.1] md:aspect-[2/1.3] ${isFinal ? "lg:max-h-[500px]" : "lg:max-h-[450px]"}`}>'
content = re.sub(chart_wrapper, chart_wrapper_replacement, content)

# Crop the empty space on the left side of the viewBox to make the chart inherently larger
content = content.replace(
    '<svg viewBox="0 0 1000 650" className="w-full h-full drop-shadow-2xl overflow-visible" style={{ padding: "0 20px" }}>',
    '<svg viewBox="150 0 850 650" className="w-full h-full drop-shadow-2xl overflow-visible" style={{ padding: "0 10px" }}>'
)

with open('thrive/hope-survey.html', 'w') as f:
    f.write(content)

