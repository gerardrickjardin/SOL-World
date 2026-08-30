import os
import shutil

def copy_recursive(src, dest):
    if not os.path.exists(src):
        return
    if os.path.isdir(src):
        if not os.path.exists(dest):
            os.makedirs(dest)
        for child in os.listdir(src):
            copy_recursive(os.path.join(src, child), os.path.join(dest, child))
    else:
        shutil.copy2(src, dest)

out_dirs = ['dist', 'public']
files_to_copy = [
    'index.html', 'profile.html', 'survey.html', 'approach.html', 'how-to-use.html',
    'rebuilding-life-challenges.html', 'employment-challenges.html', 'style.css',
    'script.js', 'hope-survey.html', 'minds-eye-white-bg.mp4', 'minds-eye.png',
    'minds-eye-animated.mp4', 'minds-eye-animated.webm'
]

for out_dir in out_dirs:
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
    
    # Copy root files
    for file in files_to_copy:
        if os.path.exists(file):
            shutil.copy2(file, os.path.join(out_dir, file))
            
    # Copy assets
    copy_recursive('assets', os.path.join(out_dir, 'assets'))
    
    # Copy solrevibe
    copy_recursive('solrevibe', os.path.join(out_dir, 'solrevibe'))
    
    # Copy solgames
    copy_recursive('solgames', os.path.join(out_dir, 'solgames'))
    
    # Replace API keys
    elevenlabs_key = os.environ.get('VITE_ELEVENLABS_API_KEY', os.environ.get('ELEVENLABS_API_KEY', ''))
    gemini_key = os.environ.get('VITE_GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY', ''))
    
    for file in ['profile.html', 'survey.html', 'solrevibe/index.html']:
        file_path = os.path.join(out_dir, file)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = content.replace('%VITE_ELEVENLABS_API_KEY%', elevenlabs_key)
            content = content.replace('%VITE_GEMINI_API_KEY%', gemini_key)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

print("Python build complete. Output generated in both dist/ and public/.")
