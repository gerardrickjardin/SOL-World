import re
import json

with open("/Users/gerardrickjardin/.gemini/antigravity-ide/brain/a2641a5c-2330-4cd0-8549-2f1da1be99db/scratch/hope_index_correct.txt", "r", encoding="utf-8") as f:
    lines = f.read().split('\n')

questions = []
current_dim = ""
space = ""

for i in range(len(lines)):
    line = lines[i].strip()
    if line.startswith("PART I:"): space = "Outer Physical Space (OPS)"
    if line.startswith("PART II:"): space = "Inner Relational Space (IRS)"
    
    if line.startswith("DIMENSION "):
        raw_dim = line.split(' (')[0].strip()
        dim_num = re.search(r'DIMENSION (\d+)', raw_dim)
        if dim_num:
            d_n = dim_num.group(1)
            d_name = raw_dim.split(': ')[1]
            if d_name == "OTHERS": d_name = "Others"
            else: d_name = d_name.capitalize()
            current_dim = f"Dimension {d_n}: {d_name}"
            
    # Sub-dimension match (e.g. 🏠 1.1 Home Experience)
    if re.match(r'^.*?\d\.\d .*?Experience', line):
        title = line
        concept = ""
        a5 = ""
        a3 = ""
        a1 = ""
        for j in range(i+1, min(i+15, len(lines))):
            subline = lines[j].strip()
            if "The Question:" in subline:
                concept = re.search(r'The Question:\s*"(.*?)"', subline).group(1)
            elif "5 Stars" in subline:
                a5 = re.split(r'\):', subline, 1)[1].strip()
            elif "3 Stars" in subline:
                a3 = re.split(r'\):', subline, 1)[1].strip()
            elif "1 Star" in subline:
                a1 = re.split(r'\):', subline, 1)[1].strip()
                break # 1 star is always last
                
        clean_title = re.sub(r'^[^\w]+', '', title)
        title_lower = clean_title.split()[1].lower()
        if "third spaces" in clean_title.lower(): title_lower = "thirdspaces"
        if "body image" in clean_title.lower(): title_lower = "bodyimage"
        if "inner circle" in clean_title.lower(): title_lower = "coreconnections"
        if "social network" in clean_title.lower(): title_lower = "socialnetwork"
        if "have-tos" in clean_title.lower(): title_lower = "havetos"
        
        prefix = "ops_" if "Outer" in space else "irs_"
        q_id = prefix + title_lower
        
        questions.append({
            "id": q_id,
            "space": space,
            "dimension": current_dim,
            "title": title,
            "concept": concept,
            "anchors": {"5.0": a5, "3.0": a3, "1.0": a1}
        })

flex_count = 0
for i in range(len(lines)):
    line = lines[i].strip()
    if re.match(r'^\d+\. .*? Score \([A-Z]+\)', line):
        flex_count += 1
        if flex_count > 2:
            break
        
        match = re.match(r'^(\d+)\. (.*?) \((.*?)\)', line)
        num = match.group(1)
        name = match.group(2)
        acronym = match.group(3)
        
        concept = ""
        a5 = ""
        a3 = ""
        a1 = ""
        
        for j in range(i+1, min(i+15, len(lines))):
            subline = lines[j].strip()
            if "The Question:" in subline:
                concept = re.search(r'The Question:\s*"(.*?)"', subline).group(1)
            elif "5 Stars" in subline:
                a5 = re.split(r'\):', subline, 1)[1].strip()
            elif "3 Stars" in subline:
                a3 = re.split(r'\):', subline, 1)[1].strip()
            elif "1 Star" in subline:
                a1 = re.split(r'\):', subline, 1)[1].strip()
                break
                
        questions.append({
            "id": f"flex_{acronym.lower()}",
            "space": "Contextual Layering",
            "dimension": f"Flex Slot {num}: {name} ({acronym})",
            "title": f"Flex {num}: {name} ({acronym})",
            "concept": concept,
            "anchors": {"5.0": a5, "3.0": a3, "1.0": a1}
        })

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

files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/hope-survey.html"
]

for filepath in files:
    with open(filepath, 'r', encoding="utf-8") as f:
        content = f.read()
    
    start_idx = content.find("const surveyQuestions = [")
    end_idx = content.find("];", start_idx) + 2
    
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + js_array + content[end_idx:]
        
    with open(filepath, 'w', encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed array in {filepath}")
files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/survey.html"
]

for filepath in files:
    import os
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding="utf-8") as f:
        content = f.read()
    
    start_idx = content.find("const surveyQuestions = [")
    end_idx = content.find("];", start_idx) + 2
    
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + js_array + content[end_idx:]
        
    with open(filepath, 'w', encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed array in {filepath}")
