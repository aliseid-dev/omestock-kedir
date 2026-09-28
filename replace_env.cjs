const fs = require('fs');

['.env.local', '.env.example'].forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/omestock-app-d42dc/g, 'ledgerly-app-d42dc');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
