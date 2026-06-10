import sys
import re

file_path = "/Users/gerardrickjardin/Documents/SOL THRiVE/hope-survey.html"

with open(file_path, "r") as f:
    content = f.read()

# The dummy config block that I previously injected:
old_config = """        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };"""

# The new config block from the user's screenshot:
new_config = """        const firebaseConfig = {
            apiKey: "AIzaSyDL6rSRy4P0PGK3xoq7hJu43xs14jZTuM8",
            authDomain: "sol-thrive.firebaseapp.com",
            projectId: "sol-thrive",
            storageBucket: "sol-thrive.firebasestorage.app",
            messagingSenderId: "494382054273",
            appId: "1:494382054273:web:326b67757f0bcdb32a8680"
        };"""

if old_config in content:
    content = content.replace(old_config, new_config)
else:
    print("Could not find the exact old_config string. Using regex fallback...")
    # Regex fallback just in case spacing is different
    content = re.sub(r'const firebaseConfig = \{.*?\};', new_config, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)

print("Injected actual Firebase Config keys successfully")
