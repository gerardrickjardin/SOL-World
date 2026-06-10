import re
import os

files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/hope-survey.html"
]

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding="utf-8") as f:
        content = f.read()

    old_display = """                                <text x="160" y="30" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle" letterSpacing="2px">TOTAL HoPE STARS</text>
                                <text x="160" y="50" fill="#00e5ff" fontSize="12" fontWeight="bold" textAnchor="middle" opacity="0.7" letterSpacing="1px">(20-100 STARS)</text>
                                
                                <text x="140" y="115" fill="#ffffff" fontSize="64" fontWeight="900" textAnchor="middle" filter="url(#glow-intense)"  style={{ fontFamily: 'sans-serif' }}>
                                    {totalScore.toFixed(1)}
                                </text>
                                <text x="220" y="115" fill="#00e5ff" fontSize="24" fontWeight="bold" textAnchor="start" opacity="0.8">/100</text>"""
                
    new_display = """                                <text x="160" y="60" fill="#ffffff" fontSize="24" fontWeight="bold" textAnchor="middle" letterSpacing="3px">HoPE INDEX</text>
                                <text x="160" y="95" fill="#00e5ff" fontSize="16" fontWeight="bold" textAnchor="middle" opacity="0.9" letterSpacing="2px">PROFILE COMPLETE</text>"""
                
    if old_display in content:
        content = content.replace(old_display, new_display)
        with open(filepath, 'w', encoding="utf-8") as f:
            f.write(content)
        print(f"Updated score display in {filepath}")
    else:
        print(f"Old display not found in {filepath}")

