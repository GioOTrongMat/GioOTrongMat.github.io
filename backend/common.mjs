export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
export const enc=new TextEncoder();
export const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export const unhex=s=>Uint8Array.from(s.match(/.{2}/g)||[],v=>parseInt(v,16));
export const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export const digest=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
export function assert(ok,message,status=400){if(!ok)throw new HttpError(status,message);}
export async function readJSON(request,max=1024*1024){
 assert(request.headers.get('content-type')?.startsWith('application/json'),'Cần gửi JSON.',415);
 assert(Number(request.headers.get('content-length')||0)<=max,'Dữ liệu quá lớn.',413);
 const reader=request.body?.getReader();assert(reader,'Thiếu dữ liệu.');const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new HttpError(413,'Dữ liệu quá lớn.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let i=0;for(const chunk of chunks){bytes.set(chunk,i);i+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new HttpError(400,'JSON không hợp lệ.');}
}
export function sameOrigin(request){assert(request.headers.get('origin')===new URL(request.url).origin,'Yêu cầu không đến từ trang admin.',403);}
export function mediaPath(path){assert(typeof path==='string'&&/^uploads\/[a-zA-Z0-9][a-zA-Z0-9_.-]{0,140}\.(png|jpe?g|webp|gif|mp4|pdf)$/i.test(path)&&!path.includes('..'),'Chỉ được ghi file media trong uploads/.',403);return path;}
export function readablePath(path){if(typeof path==='string'&&path.startsWith('/'))path=path.slice(1);if(['content/site.json','logo.png','portrai.png','Sprite.png','Milo.png','Rockstar.png','Video1.mp4','Video2.mp4','Video3.mp4'].includes(path))return path;return mediaPath(path);}
export function validateContent(raw){
 assert(typeof raw==='string'&&enc.encode(raw).length<=256*1024,'Nội dung tối đa 256 KB.');
 let d;try{d=JSON.parse(raw);}catch{throw new HttpError(400,'Nội dung JSON không hợp lệ.');}
 const str=(v,max=20000)=>assert(typeof v==='string'&&v.length<=max,'Trường nội dung không hợp lệ.');
 const list=(v,min,max)=>assert(Array.isArray(v)&&v.length>=min&&v.length<=max,'Số mục không hợp lệ.');
 const link=(v,optional=false)=>{if(optional&&!v)return;str(v,2048);assert(!/^[\s]*javascript:|^[\s]*data:|[\u0000-\u001f]/i.test(v),'Link không hợp lệ.');assert(v.startsWith('/')&&!v.startsWith('//')||v.startsWith('#')||/^https:\/\//.test(v),'Link phải dùng HTTPS hoặc đường dẫn tương đối từ /.');};
 str(d.title,200);link(d.logo);assert(d.hero&&d.about&&d.works&&d.projects&&d.contact&&d.layout,'Thiếu phần nội dung.');
 str(d.hero.label);str(d.hero.subtitle);link(d.hero.youtube);list(d.hero.lines,1,5);d.hero.lines.forEach(x=>str(x.text,200));
 for(const k of ['heading','name','bio','quote','author'])str(d.about[k]);link(d.about.image);list(d.about.tags,0,30);d.about.tags.forEach(x=>str(x.text,200));
 const drive=v=>{if(!v)return;link(v);let u;try{u=new URL(v);}catch{}const id=u?.hostname==='drive.google.com'&&(u.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1]||u.searchParams.get('id'));assert(id&&id.length>=10,'Video full phải là link HTTPS Google Drive dạng file.');};
 str(d.works.heading);str(d.works.cta);d.works.items??=[];list(d.works.items,0,100);const workIds=new Set();d.works.items.forEach((x,i)=>{str(x.name,200);link(x.image);str(x.id||'',100);assert(/^[a-z0-9][a-z0-9-]{2,80}$/.test(x.id||''),'Tác phẩm thiếu mã ổn định.');assert(!workIds.has(x.id),'Mã tác phẩm bị trùng.');workIds.add(x.id);drive(x.fullVideo);link(x.legacyPreview||x.video,true);});
 str(d.projects.heading);d.projects.items??=[];list(d.projects.items,0,100);d.projects.items.forEach(x=>{str(x.name,200);link(x.url);assert(['16:9','9:16'].includes(x.ratio),'Tỷ lệ không hợp lệ.');});
 list(d.stats,1,6);d.stats.forEach(x=>{assert(Number.isInteger(x.value)&&x.value>=0&&x.value<=1000000,'Số liệu không hợp lệ.');str(x.label,200);});
 str(d.contact.heading);str(d.contact.description);str(d.contact.email,254);assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact.email),'Email không hợp lệ.');
 const ids=['hero','instructor','works','stats','process','contact'];list(d.layout.sections,6,6);assert(new Set(d.layout.sections.map(s=>s.id)).size===6,'Các phần bị trùng.');d.layout.sections.forEach(s=>assert(ids.includes(s.id)&&typeof s.visible==='boolean','Phần không hợp lệ.'));
 assert(['1','2','3'].includes(String(d.layout.columns))&&['left','right'].includes(d.layout.aboutImage),'Bố cục không hợp lệ.');for(const k of ['accent','background'])assert(/^#[a-fA-F0-9]{6}$/.test(d.layout[k]),'Màu không hợp lệ.');
 return JSON.stringify(d,null,2)+'\n';
}
export function decodeAsset(asset){
 mediaPath(asset?.path);assert(asset.encoding==='base64'&&typeof asset.content==='string','File không hợp lệ.');assert(asset.content.length<=7*1024*1024,'File tối đa 5 MB.',413);
 let bytes;try{bytes=Uint8Array.from(atob(asset.content),c=>c.charCodeAt(0));}catch{throw new HttpError(400,'Mã file không hợp lệ.');}
 assert(bytes.length>0&&bytes.length<=5*1024*1024,'File tối đa 5 MB.',413);
 const ext=asset.path.split('.').pop().toLowerCase();const prefix=String.fromCharCode(...bytes.slice(0,12));
 const valid={png:bytes[0]===137&&prefix.slice(1,4)==='PNG',jpg:bytes[0]===255&&bytes[1]===216,jpeg:bytes[0]===255&&bytes[1]===216,gif:prefix.startsWith('GIF8'),webp:prefix.startsWith('RIFF')&&prefix.slice(8,12)==='WEBP',mp4:prefix.slice(4,8)==='ftyp',pdf:prefix.startsWith('%PDF-')};
 assert(valid[ext],'Định dạng file không khớp đuôi tên.');return bytes;
}
