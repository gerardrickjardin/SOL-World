import re
import json
import os

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
            
    if re.match(r'^.*?\d\.\d .*?Experience', line) or line.startswith("1.4") or line.startswith("2.4") or line.startswith("3.4") or line.startswith("4.4") or line.startswith("5.4") or line.startswith("6.4") or ("4.1 Mindset" in line) or ("4.2 Identity" in line) or ("4.3 Goals" in line) or ("5.1 Inner Circle" in line) or ("5.2 Social Network" in line) or ("5.3 Community Experience" in line) or ("6.1 Hobbies" in line) or ("6.2 Habits" in line) or ("6.3 Have-Tos" in line):
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
                a5 = re.split(r'5 Stars \((.*?)\):', subline)
                if len(a5) > 2:
                    a5 = f"5 Stars ({a5[1]}): {a5[2].strip()}"
                else:
                    a5 = subline.split(':', 1)[1].strip()
            elif "3 Stars" in subline:
                a3 = re.split(r'3 Stars \((.*?)\):', subline)
                if len(a3) > 2:
                    a3 = f"3 Stars ({a3[1]}): {a3[2].strip()}"
                else:
                    a3 = subline.split(':', 1)[1].strip()
            elif "1 Star" in subline:
                a1 = re.split(r'1 Star \((.*?)\):', subline)
                if len(a1) > 2:
                    a1 = f"1 Star ({a1[1]}): {a1[2].strip()}"
                else:
                    a1 = subline.split(':', 1)[1].strip()
                break
                
        clean_title = re.sub(r'^[^\w]+', '', title)
        title_lower = clean_title.split()[1].lower() if len(clean_title.split()) > 1 else clean_title.lower()
        if "third spaces" in clean_title.lower(): title_lower = "thirdspaces"
        if "body image" in clean_title.lower(): title_lower = "bodyimage"
        if "inner circle" in clean_title.lower(): title_lower = "coreconnections"
        if "social network" in clean_title.lower(): title_lower = "socialnetwork"
        if "have-tos" in clean_title.lower(): title_lower = "havetos"
        
        prefix = "ops_" if "Outer" in space else "irs_"
        q_id = prefix + title_lower
        
        if concept != "":
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
                a5 = re.split(r'5 Stars \((.*?)\):', subline)
                if len(a5) > 2:
                    a5 = f"5 Stars ({a5[1]}): {a5[2].strip()}"
                else:
                    a5 = subline.split(':', 1)[1].strip()
            elif "3 Stars" in subline:
                a3 = re.split(r'3 Stars \((.*?)\):', subline)
                if len(a3) > 2:
                    a3 = f"3 Stars ({a3[1]}): {a3[2].strip()}"
                else:
                    a3 = subline.split(':', 1)[1].strip()
            elif "1 Star" in subline:
                a1 = re.split(r'1 Star \((.*?)\):', subline)
                if len(a1) > 2:
                    a1 = f"1 Star ({a1[1]}): {a1[2].strip()}"
                else:
                    a1 = subline.split(':', 1)[1].strip()
                break
                
        if concept != "":
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
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL World/thrive/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/survey.html"
]

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding="utf-8") as f:
        content = f.read()
    
    start_idx = content.find("const surveyQuestions = [")
    end_idx = content.find("];", start_idx) + 2
    
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + js_array + content[end_idx:]
        
    with open(filepath, 'w', encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed array with labels in {filepath}")
