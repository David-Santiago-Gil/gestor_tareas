const fs = require('fs');
const path = require('path');

const queries = [
    { query: 'solo leveling', filename: 'bg_solo.png' },
    { query: 'jujutsu kaisen', filename: 'bg_jujutsu.png' },
    { query: 'kimetsu no yaiba', filename: 'bg_kimetsu.png' },
    { query: 'tokyo ghoul', filename: 'bg_tokyo.png' },
    { query: 'one punch man', filename: 'bg_onepunch.png' },
    { query: 'cyberpunk city anime', filename: 'fondo.png' }
];

async function downloadImages() {
    for (const q of queries) {
        console.log(`Buscando ${q.query}...`);
        try {
            const res = await fetch(`https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(q.query)}&categories=111&purity=100&sorting=relevance`);
            const data = await res.json();
            
            if (data.data && data.data.length > 0) {
                const imgUrl = data.data[0].path;
                console.log(`Descargando ${imgUrl} como ${q.filename}`);
                
                const imgRes = await fetch(imgUrl);
                const buffer = await imgRes.arrayBuffer();
                
                fs.writeFileSync(path.join(__dirname, 'frontend', 'public', 'img', q.filename), Buffer.from(buffer));
            } else {
                console.log(`No se encontraron imágenes para ${q.query}`);
            }
        } catch (e) {
            console.error(`Error en ${q.query}:`, e);
        }
    }
    console.log('Finalizado.');
}

downloadImages();
