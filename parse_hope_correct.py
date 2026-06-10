import re
import json

with open("/Users/gerardrickjardin/.gemini/antigravity-ide/brain/a2641a5c-2330-4cd0-8549-2f1da1be99db/scratch/hope_index_correct.txt", "r", encoding="utf-8") as f:
    text = f.read()

questions = []

# Regex patterns
section_pattern = re.compile(r'DIMENSION (\d+): (.*?)\n(.*?)(?=DIMENSION \d+|4\. THE MODULAR|$)', re.DOTALL)
flex_pattern = re.compile(r'(\d+)\. (.*?) \((.*?)\)\n.*?The Question: "(.*?)"\n.*?The Anchors:\n.*?(5 Stars.*?)\n.*?(3 Stars.*?)\n.*?(1 Star.*?)(?=\d+\. |5\. INTERPRETATION|$)', re.DOTALL)

# Because there are emojis at the start, we use a broader regex for sub_pattern
sub_pattern = re.compile(r'([^\n]*? \d\.\d .*?)\n.*?The Question: "(.*?)"\n.*?The Anchors:\n.*?(5 Stars.*?)\n.*?(3 Stars.*?)\n.*?(1 Star.*?)(?=\n[^\n]*? \d\.\d |$)', re.DOTALL)

for dim_match in section_pattern.finditer(text):
    dim_num = dim_match.group(1)
    dim_name = dim_match.group(2).split('(')[0].strip()
    dim_content = dim_match.group(3)
    
    space = "Outer Physical Space (OPS)" if int(dim_num) <= 3 else "Inner Relational Space (IRS)"
    dimension = f"Dimension {dim_num}: {dim_name.capitalize() if dim_name != 'OTHERS' else 'Others'}"
    if dim_name == "PLACES": dimension = "Dimension 1: Places"
    if dim_name == "BODY": dimension = "Dimension 2: Body"
    if dim_name == "RESOURCES": dimension = "Dimension 3: Resources"
    if dim_name == "SELF": dimension = "Dimension 4: Self"
    if dim_name == "OTHERS": dimension = "Dimension 5: Others"
    if dim_name == "LIFE": dimension = "Dimension 6: Life"
    
    for sub_match in sub_pattern.finditer(dim_content):
        title_raw = sub_match.group(1).strip()
        concept = sub_match.group(2).strip()
        
        def clean_anchor(anchor_text):
            return re.sub(r'^\d Stars? \([^)]+\):\s*', '', anchor_text).strip()
            
        a5 = clean_anchor(sub_match.group(3))
        a3 = clean_anchor(sub_match.group(4))
        a1 = clean_anchor(sub_match.group(5))
        
        # Determine ID based on existing mapping
        # E.g. "🏠 1.1 Home Experience" -> "home"
        clean_title = re.sub(r'^[^\w]+', '', title_raw) # strip leading emoji
        title_words = clean_title.split()
        num = title_words[0]
        title_text = " ".join(title_words[1:])
        
        title_lower = title_text.split()[0].lower()
        if "third spaces" in title_text.lower(): title_lower = "thirdspaces"
        if "energy" in title_text.lower(): title_lower = "energy"
        if "body image" in title_text.lower(): title_lower = "bodyimage"
        if "inner circle" in title_text.lower(): title_lower = "coreconnections" # mapped inner circle to core connections
        if "social network" in title_text.lower(): title_lower = "socialnetwork"
        if "have-tos" in title_text.lower(): title_lower = "havetos"
        
        prefix = "ops_" if int(dim_num) <= 3 else "irs_"
        q_id = prefix + title_lower
        
        questions.append({
            "id": q_id,
            "space": space,
            "dimension": dimension,
            "title": title_raw,
            "concept": concept,
            "anchors": {
                "5.0": a5,
                "3.0": a3,
                "1.0": a1
            }
        })

flex_count = 0
for flex_match in flex_pattern.finditer(text):
    flex_count += 1
    if flex_count > 2:
        break # Only process the first 2 flex slots as requested
    
    num = flex_match.group(1)
    name = flex_match.group(2).strip()
    acronym = flex_match.group(3).strip()
    concept = flex_match.group(4).strip()
    
    def clean_anchor(anchor_text):
        return re.sub(r'^\d Stars? \([^)]+\):\s*', '', anchor_text).strip()
        
    a5 = clean_anchor(flex_match.group(5))
    a3 = clean_anchor(flex_match.group(6))
    a1 = clean_anchor(flex_match.group(7))
    
    q_id = f"flex_{acronym.lower()}"
    dimension = f"Flex Slot {num}: {name} ({acronym})"
    title = f"Flex {num}: {name}"
    
    questions.append({
        "id": q_id,
        "space": "Contextual Layering",
        "dimension": dimension,
        "title": title,
        "concept": concept,
        "anchors": {
            "5.0": a5,
            "3.0": a3,
            "1.0": a1
        }
    })

# Convert to Javascript syntax string
js_array = "const surveyQuestions = [\n"
for q in questions:
    js_array += "    {\n"
    js_array += f'        id: "{q["id"]}",\n'
    js_array += f'        space: "{q["space"]}",\n'
    js_array += f'        dimension: "{q["dimension"]}",\n'
    js_array += f'        title: "{q["title"]}",\n'
    js_array += f'        concept: {json.dumps(q["concept"])},\n'
    js_array += "        anchors: {\n"
    js_array += f'            "5.0": {json.dumps(q["anchors"]["5.0"])},\n'
    js_array += f'            "3.0": {json.dumps(q["anchors"]["3.0"])},\n'
    js_array += f'            "1.0": {json.dumps(q["anchors"]["1.0"])}\n'
    js_array += "        }\n"
    js_array += "    },\n"
js_array = js_array.rstrip(',\n') + "\n];"

print(f"Parsed {len(questions)} questions")

files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL World/thrive/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/survey.html"
]

import os
for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding="utf-8") as f:
        content = f.read()
    
    # 1. Update surveyQuestions
    start_idx = content.find("const surveyQuestions = [")
    end_idx = content.find("];", start_idx) + 2
    
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + js_array + content[end_idx:]
    
    # 2. Update scaleValues from 0.0-5.0 to 1.0-5.0
    content = content.replace(
        "const scaleValues = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];",
        "const scaleValues = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];"
    )
    
    # 3. Update the logic that checks anchors mapping to "5.0", "2.5", "0.0" 
    # to "5.0", "3.0", "1.0"
    content = content.replace('q.anchors["5.0"] || q.anchors[5.0]', 'q.anchors["5.0"] || q.anchors[5.0]')
    content = content.replace('q.anchors["2.5"] || q.anchors[2.5]', 'q.anchors["3.0"] || q.anchors[3.0]')
    content = content.replace('q.anchors["0.0"] || q.anchors[0.0]', 'q.anchors["1.0"] || q.anchors[1.0]')
    
    # 4. Update the visual star labels in the DOM if hardcoded
    # Look for "0.0 Stars" -> "1.0 Star" and "2.5 Stars" -> "3.0 Stars"
    content = content.replace("0.0 Stars", "1.0 Star")
    content = content.replace("2.5 Stars", "3.0 Stars")
    
    # 5. Fix calculating percentages if any formula is hardcoded
    content = content.replace('Math.round((value / 5.0) * 100)', 'Math.round(((value - 1.0) / 4.0) * 100)')
    content = content.replace('Math.round((score / 5) * 100)', 'Math.round(((score - 1) / 4) * 100)')
    content = content.replace('const finalScore = Math.round((averageStar / 5) * 100);', 'const finalScore = Math.round(((averageStar - 1) / 4) * 100);')
    content = content.replace('averageStar = totalScore / 20;', 'averageStar = totalScore / 20;')

    with open(filepath, 'w', encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {filepath}")
