import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../content/site.json',import.meta.url)));
const ids=new Set();
for(const project of data.projects.items||[]){
 if(!/^[a-z0-9][a-z0-9-]{2,80}$/.test(project.id))throw Error('Invalid project id: '+project.id);
 if(ids.has(project.id))throw Error('Duplicate project id: '+project.id);ids.add(project.id);
 if('url' in project||'ratio' in project)throw Error('Legacy project field remains: '+project.name);
 if(project.fullVideo){const u=new URL(project.fullVideo),id=u.protocol==='https:'&&u.hostname==='drive.google.com'&&(u.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1]||u.searchParams.get('id'));if(!id)throw Error('Invalid project Drive URL: '+project.name);}
}
const js=fs.readFileSync(new URL('../assets/content.js',import.meta.url),'utf8'),html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),admin=fs.readFileSync(new URL('../admin/bootstrap.js',import.meta.url),'utf8');
for(const token of ['resetProjectSlide','playProjectSlide',"querySelector('iframe')?.remove()","preview?autoplay=1",'project-play'])if(!js.includes(token))throw Error('Missing project player contract: '+token);
if(/<iframe[^>]+drive\.google\.com\/file\/d\//i.test(html))throw Error('Drive iframe must not exist in initial HTML.');
for(const token of ['aspect-ratio: 16/9','aria-label="Dự án trước"','aria-label="Dự án tiếp theo"'])if(!html.includes(token))throw Error('Missing project layout/accessibility contract: '+token);
for(const token of ['width:1920,height:1080',"'project'",'data.projects?.items'])if(!admin.includes(token))throw Error('Missing landscape thumbnail contract: '+token);
console.log(`Projects OK: ${ids.size} item(s), lazy Drive player and reset lifecycle present.`);
