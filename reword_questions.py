import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

replacements = [
    (
        'title: "🏘️ 1.2 Neighborhood Experience",\n        concept: "How would you rate the safety, cleanliness, and overall peace of the blocks, streets, and parks near your home?",',
        'title: "🏘️ 1.2 Neighborhood",\n        subtitle: "the safety, cleanliness, and overall peace of the blocks, streets, and parks near your home",'
    ),
    (
        'title: "🏢 1.3 Third Spaces Experience",\n        concept: "How would you rate the buildings and public places you go to every day—like your school, workspace, or community center?",',
        'title: "🏢 1.3 Third Spaces",\n        subtitle: "the buildings and public places you go to every day, like your school, workspace, or community center",'
    ),
    (
        'title: "💪 2.1 Functionality Experience",\n        concept: "How would you rate your body\'s physical strength, health, and capability to do the things you want?",',
        'title: "💪 2.1 Functionality",\n        subtitle: "your body\'s physical strength, health, and capability to do the things you want",'
    ),
    (
        'title: "⚡ 2.2 Energy & Vitality Experience",\n        concept: "How would you rate your daily energy levels and how rested you feel when you wake up?",',
        'title: "⚡ 2.2 Energy & Vitality",\n        subtitle: "your daily energy levels and how rested you feel when you wake up",'
    ),
    (
        'title: "🪞 2.3 Body Image Experience",\n        concept: "How would you rate your relationship with your physical appearance and body image?",',
        'title: "🪞 2.3 Body Image",\n        subtitle: "your relationship with your physical appearance and body image",'
    ),
    (
        'title: "💰 3.1 Finances Experience",\n        concept: "How would you rate your financial security and the extra money you have left over for fun or savings?",',
        'title: "💰 3.1 Finances",\n        subtitle: "your financial security and the extra money you have left over for fun or savings",'
    ),
    (
        'title: "💻 3.2 Technology Experience",\n        concept: "How would you rate the speed, reliability, and quality of your phone, computer, and internet access?",',
        'title: "💻 3.2 Technology",\n        subtitle: "the speed, reliability, and quality of your phone, computer, and internet access",'
    ),
    (
        'title: "🚗 3.3 Essentials Experience",\n        concept: "How would you rate the reliability of your daily logistics, like transportation, utilities, and working home appliances?",',
        'title: "🚗 3.3 Essentials",\n        subtitle: "the reliability of your daily logistics, like transportation, utilities, and working home appliances",'
    ),
    (
        'title: "🧠 4.1 Mindset",\n        concept: "How would you rate your mental resilience and ability to stay positive when things go wrong?",',
        'title: "🧠 4.1 Mindset",\n        subtitle: "your mental resilience and ability to stay positive when things go wrong",'
    ),
    (
        'title: "👤 4.2 Identity",\n        concept: "How would you rate your self-worth, self-respect, and the pride you have in your character?",',
        'title: "👤 4.2 Identity",\n        subtitle: "your self-worth, self-respect, and the pride you have in your character",'
    ),
    (
        'title: "🎯 4.3 Goals",\n        concept: "How would you rate your clarity, drive, and progress toward achieving your dreams and plans?",',
        'title: "🎯 4.3 Goals",\n        subtitle: "your clarity, drive, and progress toward achieving your dreams and plans",'
    ),
    (
        'title: "🫂 5.1 Inner Circle",\n        concept: "How would you rate the safety, support, and love in your closest family and friend relationships?",',
        'title: "🫂 5.1 Inner Circle",\n        subtitle: "the safety, support, and love in your closest family and friend relationships",'
    ),
    (
        'title: "👥 5.2 Social Network",\n        concept: "How would you rate your connection, safety, and sense of belonging within your school, workspace, or peer groups?",',
        'title: "👥 5.2 Social Network",\n        subtitle: "your connection, safety, and sense of belonging within your school, workspace, or peer groups",'
    ),
    (
        'title: "🤝 5.3 Community Experience",\n        concept: "How would you rate your everyday public interactions with neighbors, strangers on the street, or online communities?",',
        'title: "🤝 5.3 Community",\n        subtitle: "your everyday public interactions with neighbors, strangers on the street, or online communities",'
    ),
    (
        'title: "🎨 6.1 Hobbies",\n        concept: "How would you rate your playtime and access to activities, art, sports, or hobbies that bring you pure joy?",',
        'title: "🎨 6.1 Hobbies",\n        subtitle: "your playtime and access to activities, art, sports, or hobbies that bring you pure joy",'
    ),
    (
        'title: "🔄 6.2 Habits",\n        concept: "How would you rate your daily habits (like nutrition, exercise, and sleep) and how well they support you?",',
        'title: "🔄 6.2 Habits",\n        subtitle: "your daily habits, like nutrition, exercise, and sleep, and how well they support you",'
    ),
    (
        'title: "📋 6.3 Have-Tos",\n        concept: "How would you rate your ability to manage daily duties (homework, chores, bills, childcare) with confidence and ease?",',
        'title: "📋 6.3 Have-Tos",\n        subtitle: "your ability to manage daily duties, like homework, chores, bills, and childcare, with confidence and ease",'
    ),
    (
        'title: "Flex 1: Gang Affinity Score (GAS)",\n        concept: "How would you rate your relationship to gangs and street hustle?",',
        'title: "Flex 1: Gang Affinity",\n        subtitle: "your relationship to gangs and street hustle",'
    ),
    (
        'title: "Flex 2: Psychological Safety",\n        concept: "How would you rate your emotional and physical safety?",',
        'title: "Flex 2: Psychological Safety",\n        subtitle: "your emotional and physical safety in your daily life",'
    )
]

for old_str, new_str in replacements:
    if old_str in content:
        content = content.replace(old_str, new_str)
    else:
        # If the exact match fails (e.g. spacing differences), we fallback to regex
        import re
        # Escape quotes and special chars for safety in regex or just use a generic regex per title
        title_match = re.search(r'title:\s*"(.*?)"', old_str).group(1)
        # Find the question block with this title
        pattern = r'(title:\s*"' + re.escape(title_match) + r'",\s*concept:\s*".*?",)'
        
        # Replace using regex if found
        if re.search(pattern, content):
            content = re.sub(pattern, new_str + ',', content)
            print(f"Fallback matched and replaced for: {title_match}")
        else:
            print(f"WARNING: Could not find '{title_match}' to replace.")

with open(file_path, "w") as f:
    f.write(content)

print("Reworded all questions from 2 to 20")
