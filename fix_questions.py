import os
import re

files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/survey.html"
]

new_questions = """        const questions = [
            { id: 1, cat: "Agency", icon: "🕯️", text: "How often do you feel a sense of hope that this situation can be resolved?", color: "#3b82f6" },
            { id: 2, cat: "Agency", icon: "🕯️", text: "How often do you believe you have the power to shift the outcome of this challenge?", color: "#3b82f6" },
            { id: 3, cat: "Agency", icon: "🕯️", text: "How often do you stay calm enough to think clearly rather than just reacting to this stressor?", color: "#3b82f6" },
            { id: 4, cat: "Agency", icon: "🕯️", text: "How often do you feel \\"in the driver’s seat\\" of your emotional response to this hurdle?", color: "#3b82f6" },
            { id: 5, cat: "Agency", icon: "🕯️", text: "How often do you feel like you are experimenting and learning as you navigate this path?", color: "#3b82f6" },
            { id: 6, cat: "Actions", icon: "🗺️", text: "How often do you see clear, positive steps you can take right now to resolve this issue?", color: "#10b981" },
            { id: 7, cat: "Actions", icon: "🗺️", text: "How often do you find yourself breaking this big mountain down into small, manageable actions?", color: "#10b981" },
            { id: 8, cat: "Actions", icon: "🗺️", text: "How often do you take consistent steps toward a solution to this problem?", color: "#10b981" },
            { id: 9, cat: "Actions", icon: "🗺️", text: "How often do you apply a specific method to solve this problem?", color: "#10b981" },
            { id: 10, cat: "Actions", icon: "🗺️", text: "How often do you stay aware of what you can control and what you can't control in this situation?", color: "#10b981" },
            { id: 11, cat: "Support", icon: "🤝", text: "How often do you turn to people who give you genuine, non-judgmental support for this specific struggle?", color: "#f59e0b" },
            { id: 12, cat: "Support", icon: "🤝", text: "How often do you speak with people who allow you to vent and brainstorm new solutions to this dilemma?", color: "#f59e0b" },
            { id: 13, cat: "Support", icon: "🤝", text: "How often do you feel comfortable asking for help with this challenge?", color: "#f59e0b" },
            { id: 14, cat: "Support", icon: "🤝", text: "How often do you lean on a community or coach that truly understands this situation?", color: "#f59e0b" },
            { id: 15, cat: "Support", icon: "🤝", text: "How often do you feel seen and heard by the people closest to you regarding this matter?", color: "#f59e0b" },
            { id: 16, cat: "Tools", icon: "⚙️", text: "How often do you use frameworks, apps, or visual aids to find new strategies for this challenge?", color: "#8b5cf6" },
            { id: 17, cat: "Tools", icon: "⚙️", text: "How often do you easily find a \\"Plan B\\" when your initial approach to this obstacle doesn't work?", color: "#8b5cf6" },
            { id: 18, cat: "Tools", icon: "⚙️", text: "How often do you access expert resources on how to resolve this specific type of problem?", color: "#8b5cf6" },
            { id: 19, cat: "Tools", icon: "⚙️", text: "How often do you feel confident that your strategy here is based on best practices?", color: "#8b5cf6" },
            { id: 20, cat: "Tools", icon: "⚙️", text: "How often do you feel equipped with the right \\"gear\\" for this specific climb?", color: "#8b5cf6" }
        ];"""

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Replace the entire const questions = [ ... ]; block
        content = re.sub(r'const questions = \[.*?\];', new_questions, content, flags=re.DOTALL)
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
