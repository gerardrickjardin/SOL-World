const fs = require('fs');
const path = require('path');

['dist', 'public'].forEach(outDirName => {
  const outDir = path.join(__dirname, outDirName);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  const files = ['index.html', 'profile.html', 'survey.html', 'approach.html', 'how-to-use.html', 'rebuilding-life-challenges.html', 'employment-challenges.html', 'style.css', 'script.js', 'hope-survey.html', 'minds-eye-white-bg.mp4', 'minds-eye.png', 'minds-eye-animated.mp4', 'minds-eye-animated.webm'];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(outDir, file));
    }
  });

  const assetsDirSrc = path.join(__dirname, 'assets');
  const assetsDirDest = path.join(outDir, 'assets');
  if (fs.existsSync(assetsDirSrc)) {
    if (!fs.existsSync(assetsDirDest)) {
      fs.mkdirSync(assetsDirDest);
    }
    fs.readdirSync(assetsDirSrc).forEach(file => {
      const srcPath = path.join(assetsDirSrc, file);
      if (fs.lstatSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, path.join(assetsDirDest, file));
      }
    });
  }

  const solrevibeDirSrc = path.join(__dirname, 'solrevibe');
  const solrevibeDirDest = path.join(outDir, 'solrevibe');
  if (fs.existsSync(solrevibeDirSrc)) {
    if (!fs.existsSync(solrevibeDirDest)) {
      fs.mkdirSync(solrevibeDirDest);
    }
    fs.readdirSync(solrevibeDirSrc).forEach(file => {
      const srcPath = path.join(solrevibeDirSrc, file);
      if (fs.lstatSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, path.join(solrevibeDirDest, file));
      }
    });
  }

  const solgamesDirSrc = path.join(__dirname, 'solgames');
  const solgamesDirDest = path.join(outDir, 'solgames');
  if (fs.existsSync(solgamesDirSrc)) {
    if (!fs.existsSync(solgamesDirDest)) {
      fs.mkdirSync(solgamesDirDest);
    }
    const copyRecursiveSync = function(src, dest) {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(childItemName => {
          copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    copyRecursiveSync(solgamesDirSrc, solgamesDirDest);
  }

  const key = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || "";
  const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

  ['profile.html', 'survey.html', 'solrevibe/index.html'].forEach(file => {
    const filePath = path.join(outDir, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/%VITE_ELEVENLABS_API_KEY%/g, key);
      content = content.replace(/%VITE_GEMINI_API_KEY%/g, geminiKey);
      fs.writeFileSync(filePath, content);
    }
  });
});

console.log("Build complete. Output generated in both dist/ and public/ to guarantee Vercel compatibility.");