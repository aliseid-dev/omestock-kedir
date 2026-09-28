const { readFileSync } = require('fs');
const content = readFileSync('src/context/TenantContext.jsx', 'utf8');
console.log(content.includes('arrayUnion'));
