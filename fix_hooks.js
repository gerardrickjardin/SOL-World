const fs = require('fs');
let code = fs.readFileSync('thrive/hope-survey.html', 'utf8');

// The block we want to extract starts at:
// "    // --- RESULTS SCREEN ---\n    if (step === 'results') {"
// and ends right before:
// "    // --- SURVEY SCREEN ---"

const resultsStartStr = "    // --- RESULTS SCREEN ---\n    if (step === 'results') {";
const resultsEndStr = "    // --- SURVEY SCREEN ---";

let startIndex = code.indexOf(resultsStartStr);
let endIndex = code.indexOf(resultsEndStr);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find results block bounds.');
    process.exit(1);
}

// Get the results block body
let resultsBlock = code.substring(startIndex, endIndex);

// We want to transform the inside of the if statement into a component.
// We remove the `if (step === 'results') {` and the matching closing `}`.
// Let's find the closing `}` which should be just before `// --- SURVEY SCREEN ---`.

let newResultsScreenCode = `
const ResultsScreen = ({ answers, surveyQuestions }) => {
` + resultsBlock.substring(resultsStartStr.length, resultsBlock.lastIndexOf('}')) + `
};
`;

// Now replace the old results block in the App with just a component call
let newAppResultsBlock = `    // --- RESULTS SCREEN ---
    if (step === 'results') {
        return <ResultsScreen answers={answers} surveyQuestions={surveyQuestions} />;
    }

`;

// Put it all together
// 1. Insert ResultsScreen before App
let finalCode = code.replace("const App = () => {", newResultsScreenCode + "\nconst App = () => {");
// 2. Replace the inside of App
finalCode = finalCode.replace(resultsBlock, newAppResultsBlock);

fs.writeFileSync('thrive/hope-survey.html', finalCode);
console.log('Fixed React Hooks error successfully!');
