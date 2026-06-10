import re

with open('thrive/hope-survey.html', 'r') as f:
    code = f.read()

results_start_str = "    // --- RESULTS SCREEN ---\n    if (step === 'results') {"
results_end_str = "    // --- SURVEY SCREEN ---"

start_idx = code.find(results_start_str)
end_idx = code.find(results_end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find results block bounds.")
    exit(1)

results_block = code[start_idx:end_idx]

# We need to find the closing brace of the if statement.
# The end of results_block is right before // --- SURVEY SCREEN ---
# So it ends with:
# "            </main>\n        );\n    }\n\n"
# Let's extract the inside of the if statement.
inside = results_block[len(results_start_str):results_block.rfind('}')]

new_results_component = """
const ResultsScreen = ({ answers, surveyQuestions }) => {""" + inside + """
};
"""

new_app_results_block = """    // --- RESULTS SCREEN ---
    if (step === 'results') {
        return <ResultsScreen answers={answers} surveyQuestions={surveyQuestions} />;
    }

"""

# Insert ResultsScreen right before App
final_code = code.replace("const App = () => {", new_results_component + "\nconst App = () => {")

# Replace old results block inside App
final_code = final_code.replace(results_block, new_app_results_block)

with open('thrive/hope-survey.html', 'w') as f:
    f.write(final_code)

print("Fixed React Hooks error successfully!")
