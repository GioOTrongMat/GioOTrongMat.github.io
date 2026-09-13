import fs from 'node:fs';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';import {HttpError,readablePath,mediaPath} from './common.mjs';
export function sqliteBinding(file=':memory:'){
 const db=new DatabaseSync(file);db.exec(fs.readFileSync(new URL('./migrations/0001_auth.sql',import.meta.url),'utf8'));
 return {prepare(sql){let args=[];const stmt=db.prepare(sql);const wrapper={bind(...values){args=values;return wrapper;},async first(){return stmt.get(...args)||null;},async run(){return stmt.run(...args);},async all(){return {results:stmt.all(...args)};}};return wrapper;},close(){db.close();},db};
}
export class LocalStore {
 constructor(root){this.root=path.resolve(root);}
 file(name){readablePath(name);return path.join(this.root,name);}
 async snapshot(){
  const files=new Map();const add=(name)=>{const p=this.file(name);if(!fs.existsSync(p))return;const bytes=fs.readFileSync(p);files.set(name,{path:name,size:bytes.length,sha:createHash('sha256').update(bytes).digest('hex')});};
  add('content/site.json');for(const name of ['logo.png','portrai.png','Sprite.png','Milo.png','Rockstar.png','Video1.mp4','Video2.mp4','Video3.mp4'])add(name);
  const uploads=path.join(this.root,'uploads');if(fs.existsSync(uploads))for(const file of fs.readdirSync(uploads)){try{mediaPath('uploads/'+file);add('uploads/'+file);}catch{}}
  return {head:createHash('sha256').update(JSON.stringify([...files])).digest('hex'),files};
 }
 async read(name,state){name=readablePath(name);const s=state||await this.snapshot();const f=s.files.get(name);if(!f)throw new HttpError(404,'Không tìm thấy file.');return {path:name,sha:f.sha,bytes:fs.readFileSync(this.file(name))};}
 async commit(changes,state){
  if((await this.snapshot()).head!==state.head)throw new HttpError(409,'File local vừa thay đổi.');
  // Synchronous writes cannot interleave with another request in this dev server.
  for(const c of changes){if(c.path!=='content/site.json')mediaPath(c.path);const p=this.file(c.path);fs.mkdirSync(path.dirname(p),{recursive:true});if(c.bytes===null)fs.unlinkSync(p);else fs.writeFileSync(p,c.bytes);}
  return {commit:'local',revision:(await this.snapshot()).files.get('content/site.json')?.sha};
 }
}
