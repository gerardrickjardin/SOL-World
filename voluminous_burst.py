import sys

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# Replace the bursting JSX
old_burst_jsx = """                {isBursting && (
                    <div key={burstKey} className="absolute top-1/2 left-1/2 w-0 h-0 z-30 pointer-events-none">
                        <span className="absolute text-2xl drop-shadow-md" style={{ animation: 'burst1 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>{emojiStr}</span>
                        <span className="absolute text-2xl drop-shadow-md" style={{ animation: 'burst2 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>{emojiStr}</span>
                        <span className="absolute text-2xl drop-shadow-md" style={{ animation: 'burst3 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>{emojiStr}</span>
                        <span className="absolute text-2xl drop-shadow-md" style={{ animation: 'burst4 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>{emojiStr}</span>
                    </div>
                )}"""

new_burst_jsx = """                {isBursting && (
                    <div key={burstKey} className="absolute top-1/2 left-1/2 w-0 h-0 z-40 pointer-events-none">
                        {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => (
                            <span key={i} className={`absolute drop-shadow-md ${i % 3 === 0 ? 'text-3xl' : i % 2 === 0 ? 'text-2xl' : 'text-xl'}`} style={{ animation: `burst${i} ${0.6 + (i*0.02)}s cubic-bezier(0.25, 1, 0.5, 1) forwards` }}>{emojiStr}</span>
                        ))}
                    </div>
                )}"""

content = content.replace(old_burst_jsx, new_burst_jsx)

# Replace the keyframes
old_keyframes = """                @keyframes burst1 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-50px, -90px) scale(1.5) rotate(-35deg); opacity: 0; } }
                @keyframes burst2 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-15px, -110px) scale(1.8) rotate(-15deg); opacity: 0; } }
                @keyframes burst3 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(15px, -100px) scale(1.6) rotate(15deg); opacity: 0; } }
                @keyframes burst4 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(50px, -80px) scale(1.4) rotate(35deg); opacity: 0; } }"""

new_keyframes = """                @keyframes burst1 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-70px, -140px) scale(1.5) rotate(-45deg); opacity: 0; } }
                @keyframes burst2 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-30px, -160px) scale(1.8) rotate(-20deg); opacity: 0; } }
                @keyframes burst3 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(0px, -180px) scale(2.0) rotate(0deg); opacity: 0; } }
                @keyframes burst4 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(30px, -160px) scale(1.8) rotate(20deg); opacity: 0; } }
                @keyframes burst5 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(70px, -140px) scale(1.5) rotate(45deg); opacity: 0; } }
                @keyframes burst6 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-100px, -90px) scale(1.2) rotate(-60deg); opacity: 0; } }
                @keyframes burst7 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-50px, -110px) scale(1.4) rotate(-30deg); opacity: 0; } }
                @keyframes burst8 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(50px, -110px) scale(1.4) rotate(30deg); opacity: 0; } }
                @keyframes burst9 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(100px, -90px) scale(1.2) rotate(60deg); opacity: 0; } }
                @keyframes burst10 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-120px, -40px) scale(1.0) rotate(-90deg); opacity: 0; } }
                @keyframes burst11 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(120px, -40px) scale(1.0) rotate(90deg); opacity: 0; } }
                @keyframes burst12 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-30px, -60px) scale(1.1) rotate(-10deg); opacity: 0; } }
                @keyframes burst13 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(30px, -60px) scale(1.1) rotate(10deg); opacity: 0; } }
                @keyframes burst14 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-80px, -10px) scale(0.9) rotate(-120deg); opacity: 0; } }
                @keyframes burst15 { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(80px, -10px) scale(0.9) rotate(120deg); opacity: 0; } }"""

content = content.replace(old_keyframes, new_keyframes)

with open(file_path, "w") as f:
    f.write(content)

print("Updated burst animation")
