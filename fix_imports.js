const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, 'src', 'features');
const sharedComponentsDir = path.join(__dirname, 'src', 'shared', 'components');

const fixImports = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      fixImports(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf-8');

      // Em `features`, os imports para `../shared/` eram `./shared/` ou `../shared/`
      // Antes, eles estavam em `src/components/` e importavam `../shared/...`
      // Agora estão em `src/features/auth/` (1 nível mais profundo), então `../shared/` vira `../../shared/`
      if (filePath.includes('/features/')) {
        content = content.replace(/from '\.\.\/shared\//g, "from '../../shared/");
        
        // Imports para TxtModal que antes era './TxtModal'
        content = content.replace(/from '\.\/TxtModal'/g, "from '../../shared/components/TxtModal'");
        
        // Imports para Header que antes era './Header'
        content = content.replace(/from '\.\/Header'/g, "from '../../shared/components/Header'");

        // Dashboard importando Formularios
        if (filePath.includes('/dashboard/SystemController.tsx')) {
          content = content.replace(/from '\.\/Formulario/g, "from '../formularios/Formulario");
          content = content.replace(/import\('\.\/Formulario/g, "import('../formularios/Formulario");
          content = content.replace(/import\('\.\/AdminPanel/g, "import('../admin/AdminPanel");
          content = content.replace(/import\('\.\/RelatoriosPage/g, "import('../relatorios/RelatoriosPage");
          content = content.replace(/import\('\.\/LogsAuditoriaPage/g, "import('../auditoria/LogsAuditoriaPage");
          content = content.replace(/from '\.\/NavegacaoFormularios/g, "from './NavegacaoFormularios");
          content = content.replace(/from '\.\/GerenciarFormularios/g, "from './GerenciarFormularios");
        }
      }

      // Em `shared/components`, os imports para `../shared/` antes eram `../shared/`
      // Como a pasta já é `shared/components`, `../shared/` na verdade é `../`
      if (filePath.includes('/shared/components/')) {
        content = content.replace(/from '\.\.\/shared\//g, "from '../");
        // Na verdade, se estava em `src/components/Header.tsx` e chamava `../shared/contexts/AuthContext`
        // Agora está em `src/shared/components/Header.tsx` e deve chamar `../contexts/AuthContext`
      }

      fs.writeFileSync(filePath, content);
    }
  }
};

fixImports(featuresDir);
fixImports(sharedComponentsDir);

// App.tsx
const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appTsxPath, 'utf-8');
appContent = appContent.replace(/from '\.\/components\/ProtectedRoute'/g, "from './features/auth/ProtectedRoute'");
appContent = appContent.replace(/from '\.\/components\/SystemController'/g, "from './features/dashboard/SystemController'");
fs.writeFileSync(appTsxPath, appContent);

console.log('Imports fixados!');
