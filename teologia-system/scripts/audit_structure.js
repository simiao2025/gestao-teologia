const fs = require('fs');
const path = require('path');

const ALLOWED_ROOT_DIRS = [
  '.agent',
  '.git',
  '.next',
  '.vscode',
  'api',        // Legacy pages/api if existing
  'app',
  'components',
  'constants',
  'hooks',
  'lib',
  'node_modules',
  'public',
  'scripts',
  'services',
  'styles',
  'types',
  'utils'       // Legacy utils often allowed, but prefer lib
];

const ALLOWED_FILES = [
  '.env',
  '.env.local',
  '.eslintrc.json',
  '.gitignore',
  'ARCHITECTURE.md',
  'ARCHITECTURE_PROPOSAL.md',
  'AUDIT_REPORT.md',
  'DOMAIN_MAP.md',
  'INSTALACAO.md',
  'README.md',
  'components.json',
  'middleware.ts',
  'next-env.d.ts',
  'next.config.js',
  'package-lock.json',
  'package.json',
  'postcss.config.js',
  'tailwind.config.js',
  'tsconfig.json'
];

function checkStructure() {
  const rootDir = process.cwd();
  const items = fs.readdirSync(rootDir);
  let hasErrors = false;

  console.log('🛡️  Auditando estrutura do projeto...');

  items.forEach(item => {
    // Ignore build logs or temporary txt files
    if (item.endsWith('.txt')) return;

    if (!ALLOWED_ROOT_DIRS.includes(item) && !ALLOWED_FILES.includes(item)) {
       // Check if it's a file or directory
       // We'll be lenient with unknown files, strict with unknown directories
       try {
         const stats = fs.statSync(path.join(rootDir, item));
         if (stats.isDirectory()) {
           console.error(`❌ DIRETÓRIO NÃO PERMITIDO DETECTADO: /${item}`);
           console.error(`   -> A arquitetura permite apenas: ${ALLOWED_ROOT_DIRS.join(', ')}`);
           hasErrors = true;
         }
       } catch (e) {}
    }
  });

  // Verify Services Logic separation
  // This is a simple heuristic check
  if (fs.existsSync(path.join(rootDir, 'components'))) {
     // Advanced check: Grep for 'supabase.from' inside components (should be in services)
     // Skipping for this simple script, keeping it structural.
  }

  if (hasErrors) {
    console.error('\n🚫 Auditoria de Arquitetura FALHOU. Remova ou mova os diretórios acima.');
    process.exit(1);
  } else {
    console.log('✅ Estrutura do projeto está BLINDADA e correta.');
  }
}

checkStructure();
