import os

files = [
    "/Users/gerardrickjardin/Documents/SOL World/thrive/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html",
    "/Users/gerardrickjardin/Documents/SOL THRiVE/public/hope-survey.html"
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()

        # Update handleNextQ to accept a value
        old_handleNextQ = """    const handleNextQ = () => {
        const qId = surveyQuestions[currentQIndex].id;
        const newAnswers = { ...answers, [qId]: currentSelection !== null ? currentSelection : 2.5 };"""
        
        new_handleNextQ = """    const handleNextQ = (val) => {
        const finalVal = val !== undefined ? val : (currentSelection !== null ? currentSelection : 2.5);
        const qId = surveyQuestions[currentQIndex].id;
        const newAnswers = { ...answers, [qId]: finalVal };"""
        
        content = content.replace(old_handleNextQ, new_handleNextQ)

        # Update HopeSlider signature
        content = content.replace(
            "const HopeSlider = ({ currentSelection, setCurrentSelection, currentQ }) => {",
            "const HopeSlider = ({ currentSelection, setCurrentSelection, currentQ, onNext }) => {"
        )

        # Update HopeSlider input
        old_input = """                    onChange={(e) => setCurrentSelection(parseFloat(e.target.value))}
 />"""
        new_input = """                    onChange={(e) => setCurrentSelection(parseFloat(e.target.value))}
                    onMouseUp={(e) => onNext(parseFloat(e.target.value))}
                    onTouchEnd={(e) => onNext(parseFloat(e.target.value))}
 />"""
        content = content.replace(old_input, new_input)
        
        # Also need to handle click on ticks container if they want to click a tick directly (though ticks aren't buttons currently)
        # We can leave ticks as they are.
        
        # Update renderRater to pass onNext
        old_renderRater = """                    <HopeSlider 
                        currentSelection={currentSelection !== null ? currentSelection : 2.5} 
                        setCurrentSelection={setCurrentSelection} 
                        currentQ={surveyQuestions[currentQIndex]} 
 />"""
        new_renderRater = """                    <HopeSlider 
                        currentSelection={currentSelection !== null ? currentSelection : 2.5} 
                        setCurrentSelection={setCurrentSelection} 
                        currentQ={surveyQuestions[currentQIndex]}
                        onNext={handleNextQ}
 />"""
        content = content.replace(old_renderRater, new_renderRater)

        # Remove the Next button but keep the Back button container formatted
        old_buttons = """                <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
                    <button 
                        onClick={handlePrevQ}
                        className={`text-slate-500 font-bold hover:text-slate-800 px-6 py-3 transition-colors flex items-center gap-2 ${currentQIndex === 0 ? 'invisible' : ''}`}
>
                        <span>←</span> Back
                    </button>
                    <button 
                        onClick={() => handleNextQ()}
                        className={`px-10 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(79,70,229,0.4)] cursor-pointer shadow-lg`}
>
                        {currentQIndex === surveyQuestions.length - 1 ? 'Generate Index Map 🚀' : 'Next Question →'}
                    </button>
                </div>"""
        
        # If they had "onClick={handleNextQ}" instead of "onClick={() => handleNextQ()}" we need to catch it:
        old_buttons_alt = """                <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
                    <button 
                        onClick={handlePrevQ}
                        className={`text-slate-500 font-bold hover:text-slate-800 px-6 py-3 transition-colors flex items-center gap-2 ${currentQIndex === 0 ? 'invisible' : ''}`}
>
                        <span>←</span> Back
                    </button>
                    <button 
                        onClick={handleNextQ}
                        className={`px-10 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(79,70,229,0.4)] cursor-pointer shadow-lg`}
>
                        {currentQIndex === surveyQuestions.length - 1 ? 'Generate Index Map 🚀' : 'Next Question →'}
                    </button>
                </div>"""

        new_buttons = """                <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
                    <button 
                        onClick={handlePrevQ}
                        className={`text-slate-500 font-bold hover:text-slate-800 px-6 py-3 transition-colors flex items-center gap-2 ${currentQIndex === 0 ? 'invisible' : ''}`}
>
                        <span>←</span> Back
                    </button>
                    {/* Next Question button removed as per user request */}
                </div>"""

        if old_buttons in content:
            content = content.replace(old_buttons, new_buttons)
        elif old_buttons_alt in content:
            content = content.replace(old_buttons_alt, new_buttons)

        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
