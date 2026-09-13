const fs=require('node:fs');const assert=require('node:assert/strict');const path=require('node:path');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const d=JSON.parse(read('content/site.json'));const config=JSON.parse(read('admin/config.yml'));
assert.equal(config.backend.repo,'GioOTrongMat/GioOTrongMat.github.io');
const ids=d.layout.sections.map(s=>s.id);assert.equal(new Set(ids).size,6);assert.deepEqual([...ids].sort(),['contact','hero','instructor','process','stats','works']);
function checkFields(fields,data,prefix='site'){for(const field of fields){const value=data[field.name];if(field.required!==false)assert.ok(value!==null&&value!==undefined,`${prefix}.${field.name} is missing`);if(value==null)continue;if(field.widget==='object')checkFields(field.fields,value,prefix+'.'+field.name);if(field.widget==='list'){assert.ok(Array.isArray(value));if(field.min!==undefined)assert.ok(value.length>=field.min);if(field.max!==undefined)assert.ok(value.length<=field.max);value.forEach((v,i)=>checkFields(field.fields,v,`${prefix}.${field.name}[${i}]`));}}}
checkFields(config.collections[0].files[0].fields,d);
for(const asset of [d.logo,d.about.image,...d.works.items.flatMap(w=>[w.image,w.video]).filter(Boolean)])if(asset.startsWith('/')){const parts=asset.slice(1).split('/');let base=root;for(const part of parts){assert.ok(fs.readdirSync(base).includes(part),`Asset case mismatch or missing: ${asset}`);base=path.join(base,part);}}
new Function(read('assets/content.js'));const html=read('index.html');for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(match[1]);assert.ok(html.includes('window.siteReady.then'));assert.ok(!html.includes('src="portrait.png"'));
console.log('PASS: CMS schema/data, unique sections, asset paths/case, JavaScript syntax and initialization order.');
