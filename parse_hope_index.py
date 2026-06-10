import re
import json

with open("/Users/gerardrickjardin/.gemini/antigravity-ide/brain/a2641a5c-2330-4cd0-8549-2f1da1be99db/scratch/hope_index.txt", "r") as f:
    text = f.read()

questions = []

# Regex patterns
section_pattern = re.compile(r'DIMENSION (\d+): (.*?)\n(.*?)(?=DIMENSION \d+|4\. THE MODULAR|$)', re.DOTALL)
flex_pattern = re.compile(r'Flex Question (\d+) \((.*?)\)\n"(.*?)"\n.*?The Anchors:\n.*?(5\.0 Stars.*?)\n.*?(2\.5 Stars.*?)\n.*?(0\.0 Stars.*?)(?=Flex Question|5\. INTERPRETATION|$)', re.DOTALL)

sub_pattern = re.compile(r'(\d\.\d) (.*? Experience)\n.*?The Concept: (.*?)\n.*?The Anchors:\n.*?(5\.0 Stars.*?)\n.*?(2\.5 Stars.*?)\n.*?(0\.0 Stars.*?)(?=\d\.\d |$)', re.DOTALL)

for dim_match in section_pattern.finditer(text):
    dim_num = dim_match.group(1)
    dim_name = dim_match.group(2).strip()
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
        num = sub_match.group(1)
        title = sub_match.group(2).strip()
        concept = sub_match.group(3).strip()
        
        def clean_anchor(anchor_text):
            return re.sub(r'^\d\.\d Stars \([^)]+\):\s*', '', anchor_text).strip()
            
        a5 = clean_anchor(sub_match.group(4))
        a25 = clean_anchor(sub_match.group(5))
        a0 = clean_anchor(sub_match.group(6))
        
        # Determine ID based on existing mapping
        title_lower = title.split()[0].lower()
        if "third spaces" in title.lower(): title_lower = "thirdspaces"
        if "energy" in title.lower(): title_lower = "energy"
        if "body image" in title.lower(): title_lower = "bodyimage"
        if "core connections" in title.lower(): title_lower = "coreconnections"
        if "social network" in title.lower(): title_lower = "socialnetwork"
        if "have-tos" in title.lower(): title_lower = "havetos"
        
        prefix = "ops_" if int(dim_num) <= 3 else "irs_"
        q_id = prefix + title_lower
        
        questions.append({
            "id": q_id,
            "space": space,
            "dimension": dimension,
            "title": f"{num} {title}",
            "concept": concept,
            "anchors": {
                "5.0": a5,
                "2.5": a25,
                "0.0": a0
            }
        })

for flex_match in flex_pattern.finditer(text):
    num = flex_match.group(1)
    name = flex_match.group(2).strip()
    concept = flex_match.group(3).strip()
    
    def clean_anchor(anchor_text):
        return re.sub(r'^\d\.\d Stars \([^)]+\):\s*', '', anchor_text).strip()
        
    a5 = clean_anchor(flex_match.group(4))
    a25 = clean_anchor(flex_match.group(5))
    a0 = clean_anchor(flex_match.group(6))
    
    q_id = "flex_gas" if num == "1" else "flex_psa"
    dimension = f"Flex Slot {num}: {name} ({q_id.split('_')[1].upper()})"
    title = f"Flex {num}: {name}"
    
    questions.append({
        "id": q_id,
        "space": "Contextual Layering",
        "dimension": dimension,
        "title": title,
        "concept": concept,
        "anchors": {
            "5.0": a5,
            "2.5": a25,
            "0.0": a0
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
    js_array += f'            5.0: {json.dumps(q["anchors"]["5.0"])},\n'
    js_array += f'            2.5: {json.dumps(q["anchors"]["2.5"])},\n'
    js_array += f'            0.0: {json.dumps(q["anchors"]["0.0"])}\n'
    js_array += "        }\n"
    js_array += "    },\n"
js_array = js_array.rstrip(',\n') + "\n];"

print(f"Parsed {len(questions)} questions")

# Inject into files
files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/hope-survey.html"
]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace from const surveyQuestions = [ down to ];
    start_idx = content.find("const surveyQuestions = [")
    end_idx = content.find("];", start_idx) + 2
    
    if start_idx != -1 and end_idx != -1:
        new_content = content[:start_idx] + js_array + content[end_idx:]
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        print(f"Could not find surveyQuestions in {filepath}")
