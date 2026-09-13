import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync(new URL('../content/site.json',import.meta.url)));
const ids=new Set();
for(const w of d.works.items||[]){
 if(!/^[a-z0-9][a-z0-9-]{2,80}$/.test(w.id))throw Error('Invalid work id: '+w.id);
 if(ids.has(w.id))throw Error('Duplicate work id: '+w.id);ids.add(w.id);
 if(w.fullVideo){const u=new URL(w.fullVideo),id=u.hostname==='drive.google.com'&&(u.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1]||u.searchParams.get('id'));if(!id)throw Error('Invalid Drive URL: '+w.name);}
}
const js=fs.readFileSync(new URL('../assets/content.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../assets/content.css',import.meta.url),'utf8');
for(const token of ['--visible:7','aspect-ratio:9/16','scale(var(--dock-s,1))'])if(!css.includes(token))throw Error('Missing CSS contract: '+token);
for(const token of ["currentTime=0","currentTime>=10","currentTime>=12.95","preload='none'"])if(!js.includes(token))throw Error('Missing preview contract: '+token);
console.log(`Works OK: ${ids.size} item(s), portrait slider and preview timeline present.`);
