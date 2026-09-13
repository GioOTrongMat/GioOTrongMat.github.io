import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const dest=path.join(root,'backend/public');fs.mkdirSync(dest,{recursive:true});
for(const file of ['index.html','login.css','bootstrap.js','config.yml','connection.json','vendor/decap-cms.js','vendor/decap-cms.js.LICENSE.txt']){
 const source=path.join(root,'admin',file);if(!fs.existsSync(source))throw Error('Missing '+file);const target=path.join(dest,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);
}
console.log('Admin assets prepared; no secrets included.');
