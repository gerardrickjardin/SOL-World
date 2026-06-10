import sys
import re

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# 1. Inject Firebase CDN scripts before <script type="text/babel">
firebase_scripts = """    <!-- Firebase Configuration and SDKs -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
        import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

        // Developer: Replace this with your actual Firebase Web App config
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };

        let app, auth, db;
        try {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
        } catch (error) {
            console.error("Firebase not configured correctly yet. Please update firebaseConfig.");
        }

        window.firebaseAuth = auth;
        window.firebaseDb = db;
        window.firebaseApp = app;
        window.signInWithEmailAndPassword = signInWithEmailAndPassword;
        window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
        window.onAuthStateChanged = onAuthStateChanged;
        window.signOut = signOut;
        window.doc = doc;
        window.setDoc = setDoc;
        window.getDoc = getDoc;
    </script>

    <script type="text/babel">"""

content = content.replace('    <script type="text/babel">', firebase_scripts)


# 2. Inject Auth Modal Component
auth_modal_component = """
    // --- AUTHENTICATION MODAL COMPONENT ---
    const AuthModal = ({ onClose, onLogin }) => {
        const [isSignUp, setIsSignUp] = React.useState(false);
        const [email, setEmail] = React.useState("");
        const [password, setPassword] = React.useState("");
        const [error, setError] = React.useState("");
        const [loading, setLoading] = React.useState(false);

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!window.firebaseAuth) {
                setError("Firebase is not configured yet. Please contact support.");
                return;
            }
            setLoading(true);
            setError("");
            try {
                if (isSignUp) {
                    await window.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
                } else {
                    await window.signInWithEmailAndPassword(window.firebaseAuth, email, password);
                }
                onLogin();
                onClose();
            } catch (err) {
                console.error(err);
                setError(err.message.replace("Firebase:", "").trim());
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                    <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    <h2 className="text-3xl font-black text-slate-900 mb-2">{isSignUp ? "Create Account" : "Welcome Back"}</h2>
                    <p className="text-slate-500 mb-6">{isSignUp ? "Sign up to save your HoPE Index progress." : "Log in to resume your HoPE Index."}</p>

                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors" placeholder="you@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl mt-2 transition-all transform active:scale-95 flex justify-center items-center">
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                isSignUp ? "Sign Up & Save Progress" : "Log In & Resume"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500 font-medium">
                        {isSignUp ? "Already have an account? " : "Don't have an account? "}
                        <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 font-bold hover:underline">
                            {isSignUp ? "Log In" : "Sign Up"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const HopeSurveyApp = () => {"""

content = content.replace('    const HopeSurveyApp = () => {', auth_modal_component)


# 3. Add state variables to HopeSurveyApp
state_vars = """    const HopeSurveyApp = () => {
        // --- AUTHENTICATION STATE ---
        const [user, setUser] = React.useState(null);
        const [authLoading, setAuthLoading] = React.useState(true);
        const [showAuthModal, setShowAuthModal] = React.useState(false);"""

content = content.replace('    const HopeSurveyApp = () => {', state_vars)


# 4. Add useEffect for Auth state listener and progress loading
auth_effect = """        const [isPulsing, setIsPulsing] = React.useState(true);

        // --- AUTH & PROGRESS LOADING EFFECT ---
        React.useEffect(() => {
            if (!window.firebaseAuth) {
                setAuthLoading(false);
                return;
            }
            const unsubscribe = window.onAuthStateChanged(window.firebaseAuth, async (currentUser) => {
                setUser(currentUser);
                setAuthLoading(false);
                if (currentUser) {
                    try {
                        const docRef = window.doc(window.firebaseDb, "hope_surveys", currentUser.uid);
                        const docSnap = await window.getDoc(docRef);
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            if (data.answers) {
                                setAnswers(data.answers);
                                const answeredCount = Object.keys(data.answers).length;
                                if (answeredCount > 0 && answeredCount < surveyQuestions.length) {
                                    setCurrentStep(answeredCount);
                                } else if (answeredCount >= surveyQuestions.length) {
                                    setCurrentStep(surveyQuestions.length);
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error loading progress:", error);
                    }
                }
            });
            return () => unsubscribe && unsubscribe();
        }, []);

        // --- SAVE PROGRESS FUNCTION ---
        const saveProgress = async (newAnswers) => {
            if (!user || !window.firebaseDb) return;
            try {
                await window.setDoc(window.doc(window.firebaseDb, "hope_surveys", user.uid), {
                    answers: newAnswers,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            } catch (error) {
                console.error("Error saving progress:", error);
            }
        };"""

content = content.replace('        const [isPulsing, setIsPulsing] = React.useState(true);', auth_effect)


# 5. Call saveProgress in handleNext
old_handle_next = """        const handleNext = () => {
            if (isPulsing) setIsPulsing(false);

            if (currentStep < surveyQuestions.length) {
                const currentQ = surveyQuestions[currentStep];
                setAnswers({ ...answers, [currentQ.id]: { value: currentValue, note: currentNote } });
                setCurrentStep(prev => prev + 1);"""

new_handle_next = """        const handleNext = () => {
            if (isPulsing) setIsPulsing(false);

            if (currentStep < surveyQuestions.length) {
                const currentQ = surveyQuestions[currentStep];
                const newAnswers = { ...answers, [currentQ.id]: { value: currentValue, note: currentNote } };
                setAnswers(newAnswers);
                saveProgress(newAnswers);
                setCurrentStep(prev => prev + 1);"""

content = content.replace(old_handle_next, new_handle_next)


# 6. Add Auth Header UI
auth_header_ui = """                <header className="flex justify-between items-center mb-12">
                    <div className="flex flex-col">
                        <span className="text-emerald-400 font-bold tracking-widest text-sm uppercase mb-1 drop-shadow-md">SOL THRiVE</span>
                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">HoPE Index</h1>
                    </div>
                    {/* User Auth Controls */}
                    <div className="flex items-center gap-4">
                        {authLoading ? (
                            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
                        ) : user ? (
                            <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                <span className="text-slate-300 font-medium text-sm hidden md:block">{user.email}</span>
                                <button onClick={() => window.signOut(window.firebaseAuth)} className="text-slate-400 hover:text-white font-bold text-sm transition-colors ml-2">Log Out</button>
                            </div>
                        ) : (
                            <button onClick={() => setShowAuthModal(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-2.5 rounded-full transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/20 text-sm">
                                Log in to Save Progress
                            </button>
                        )}
                    </div>
                </header>

                {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={() => {}} />}"""

old_header_ui = """                <header className="flex flex-col mb-12">
                    <span className="text-emerald-400 font-bold tracking-widest text-sm uppercase mb-1 drop-shadow-md">SOL THRiVE</span>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">HoPE Index</h1>
                </header>"""

content = content.replace(old_header_ui, auth_header_ui)


with open(file_path, "w") as f:
    f.write(content)

print("Injected Firebase Auth, AuthModal, and Progress Tracking Logic")
