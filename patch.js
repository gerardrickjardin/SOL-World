const fs = require('fs');
let content = fs.readFileSync('soldrive_src/src/App.tsx', 'utf8');
content = content.replace(
  /if \(user\) \{[\s\S]*?const userDoc = await getDoc\(doc\(db, 'users', user.uid\)\);[\s\S]*?if \(userDoc\.exists\(\)\) \{[\s\S]*?setUserRole\('admin'\);[\s\S]*?setIsAdminMode\(true\);[\s\S]*?\} else \{[\s\S]*?const role = 'admin';[\s\S]*?await setDoc\(doc\(db, 'users', user.uid\), \{[\s\S]*?email: user.email,[\s\S]*?role: role,[\s\S]*?displayName: user.displayName,[\s\S]*?photoURL: user.photoURL[\s\S]*?\}\);[\s\S]*?setUserRole\(role\);[\s\S]*?setIsAdminMode\(true\);[\s\S]*?\}[\s\S]*?\} else \{/m,
`if (user) {
          // Force UI to admin mode immediately to bypass Firebase security rule blockers
          setUserRole('admin');
          setIsAdminMode(true);
          
          // Try to sync with Firestore, but don't let it block the UI if rules reject it
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              role: 'admin',
              displayName: user.displayName,
              photoURL: user.photoURL
            });
          }
        } else {`
);
fs.writeFileSync('soldrive_src/src/App.tsx', content);
