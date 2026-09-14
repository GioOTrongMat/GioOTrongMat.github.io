window.CMS_MANUAL_INIT=true;
let auth=null,started=false,revision=null;
const panel=document.getElementById('login-panel');const form=document.getElementById('login-form');const message=document.getElementById('message');const loginButton=document.getElementById('login-button');
function tell(text,error=false){message.textContent=text;message.className=error?'error':'';}
async function api(path,body,requestMeta){
 const serialized=body===undefined?undefined:JSON.stringify(body),payloadBytes=serialized===undefined?0:new TextEncoder().encode(serialized).length;
 if(requestMeta)console.info('admin:request',{...requestMeta,payloadBytes});
 let response;
 try{response=await fetch(path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':auth?.csrf||''},body:serialized});}
 catch(error){console.error('admin:network-error',{path,method:body===undefined?'GET':'POST',payloadBytes,...requestMeta,name:error?.name,message:error?.message});throw new Error('Không thể kết nối backend. Kiểm tra mạng rồi thử lại.');}
 let data;try{data=await response.json();}catch{throw Object.assign(new Error(response.status===413?'Yêu cầu quá lớn. Thumbnail phải được xử lý xuống dưới 5 MB trước khi lưu.':'Backend trả dữ liệu không hợp lệ.'),{status:response.status});}
 if(!response.ok){if(response.status===401&&started){panel.hidden=false;tell('Phiên đã hết hạn. Đăng nhập lại để giữ và lưu phần đang chỉnh sửa.',true);}const fallback=response.status===413?'Yêu cầu quá lớn. Thumbnail phải nhỏ hơn 5 MB.':response.status===409?'Nội dung đã thay đổi. Tải lại Admin trước khi lưu.':'Không thể xử lý yêu cầu.';throw Object.assign(new Error(data.error||fallback),{status:response.status});}return data;
}
function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(new Error('Không tải được trình biên tập. Hãy tải lại trang.'));document.head.append(el);});}
function slug(value){return (value||'work').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'work';}
function normalizeWorks(raw){
 const data=JSON.parse(raw),seen=new Set();for(const item of data.works?.items||[]){let id=item.id||slug(item.name),n=2;while(seen.has(id))id=slug(item.name)+'-'+n++;item.id=id;seen.add(id);}return JSON.stringify(data,null,2)+'\n';
}
async function portraitWebP(file){
 if(!file?.type?.startsWith('image/'))throw Error('Thumbnail phải là file ảnh.');
 const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d',{alpha:false});const scale=Math.max(1080/bitmap.width,1920/bitmap.height),w=bitmap.width*scale,h=bitmap.height*scale;ctx.drawImage(bitmap,(1080-w)/2,(1920-h)/2,w,h);bitmap.close();
 let blob;for(const quality of [.82,.72,.62,.52,.42]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(blob&&blob.size<5*1024*1024)break;}if(!blob||blob.size>=5*1024*1024)throw Error('Thumbnail sau xử lý vẫn lớn hơn 5 MB. Hãy chọn ảnh ít chi tiết hơn.');
 const base=(file.name||'thumbnail').replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,70)||'thumbnail';return new File([blob],base+'-'+Date.now()+'.webp',{type:'image/webp'});
}
function bytesFromBase64(value){const raw=atob(value.replace(/^data:[^,]+,/,'')),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes;}
function base64FromBytes(bytes){let out='';for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(out);}
async function processWorkAssets(payload){
 const p=payload.params||{},file=(p.dataFiles||[p.entry])[0];if(file?.path!=='content/site.json')return;
 const data=JSON.parse(file.raw),assets=p.assets||[],items=data.works?.items||[];
 const clean=value=>{if(typeof value!=='string')return '';try{value=decodeURIComponent(value);}catch{}try{const u=new URL(value,location.origin);if(u.origin===location.origin)value=u.pathname;}catch{}return value.replace(/^\/+/, '').replace(/^\.\//,'');};
 const byPath=new Map(),byName=new Map();for(const asset of assets){const path=clean(asset.path),name=path.split('/').pop();if(path)byPath.set(path,asset);if(name)byName.set(name,[...(byName.get(name)||[]),asset]);}
 for(const item of items){const wanted=clean(item.image),name=wanted.split('/').pop();let asset=byPath.get(wanted);if(!asset&&name&&byName.get(name)?.length===1)asset=byName.get(name)[0];if(!asset)continue;
  if(!/\.(png|jpe?g|gif|webp)$/i.test(asset.path||''))throw Error(`Thumbnail của ${item.name||'Work mới'} không phải file ảnh.`);
  const ext=asset.path.split('.').pop().toLowerCase(),type=ext==='png'?'image/png':ext==='gif'?'image/gif':ext==='webp'?'image/webp':'image/jpeg',sourceBytes=bytesFromBase64(asset.content),source=new File([sourceBytes],asset.path.split('/').pop(),{type}),processed=await portraitWebP(source),next='uploads/'+processed.name;
  asset.path=next;asset.content=base64FromBytes(new Uint8Array(await processed.arrayBuffer()));asset.encoding='base64';item.image='/'+next;
  console.info('admin:thumbnail',{work:item.name||'',inputBytes:sourceBytes.length,outputBytes:processed.size,width:1080,height:1920,path:'/'+next});
 }
 file.raw=JSON.stringify(data,null,2)+'\n';
}
function persistMeta(payload){const assets=payload.params?.assets||[];return {action:payload.action,assetCount:assets.length,assets:assets.map(asset=>{const contentLength=typeof asset.content==='string'?asset.content.length:0;return {path:asset.path,contentLength,estimatedBytes:Math.floor(contentLength*3/4)};})};}
let portraitIntent=false;
document.addEventListener('click',event=>{
 const button=event.target.closest?.('button');if(!button||!/Chọn hình khác|Choose an image/i.test(button.textContent))return;
 let node=button;for(let i=0;i<8&&node;i++,node=node.parentElement){if(/THUMBNAIL/i.test(node.textContent||'')){portraitIntent=true;break;}}
},true);
document.addEventListener('change',async event=>{
 const input=event.target;if(!(input instanceof HTMLInputElement)||input.type!=='file'||input.dataset.portraitReady)return;
 const field=input.closest('[class*="ControlContainer"], [class*="Field"]');if((!field||!/Thumbnail/i.test(field.textContent))&&!portraitIntent||!input.files?.[0])return;
 event.stopImmediatePropagation();input.disabled=true;
 try{const processed=await portraitWebP(input.files[0]),dt=new DataTransfer();dt.items.add(processed);input.files=dt.files;input.dataset.portraitReady='1';input.dispatchEvent(new Event('change',{bubbles:true}));delete input.dataset.portraitReady;}
 catch(e){input.value='';alert(e.message||'Không thể xử lý thumbnail. Vui lòng chọn ảnh khác.');}
 finally{input.disabled=false;portraitIntent=false;}
},true);
async function editor(){
 if(started){panel.hidden=true;return;}
 const response=await fetch('config.yml');if(!response.ok)throw Error('Không tải được cấu hình.');const config=await response.json();
 await script('vendor/decap-cms.js');
 class SecureBackend {
  constructor(config,options){
   const backend=CMS.getBackend('proxy').init(config,options);
   const AuthPage=backend.authComponent();
   backend.authComponent=()=>class extends AuthPage { componentDidMount(){super.componentDidMount?.();this.props.onLogin({});} };
   backend.authenticate=backend.restoreUser=async()=>{auth=await api('/api/session');return {login:auth.username,name:auth.username};};
   backend.logout=()=>{endSession();};
   backend.request=async payload=>{
    if(payload.action==='persistEntry'){await processWorkAssets(payload);const file=(payload.params?.dataFiles||[payload.params?.entry])[0];if(file?.path==='content/site.json')file.raw=normalizeWorks(file.raw);}
    const body={...payload,revision},meta=payload.action==='persistEntry'?persistMeta(payload):undefined;const result=await api('/api/v1',body,meta);
    if(payload.action==='getEntry')revision=result.file.id;
    if(payload.action==='entriesByFiles')revision=result.find(e=>e.file.path==='content/site.json')?.file.id||revision;
    if(payload.action==='persistEntry')revision=result.revision||revision;
    return result;
   };
   backend.getMedia=async(mediaFolder='uploads')=>backend.request({action:'getMedia',params:{mediaFolder}});
   return backend;
  }
 }
 CMS.registerBackend('secure-proxy',SecureBackend);
 config.backend={name:'secure-proxy',proxy_url:'/api/v1',branch:'main'};config.local_backend=false;config.load_config_file=false;
 CMS.init({config});started=true;panel.hidden=true;document.getElementById('logout').hidden=false;
}
async function endSession(){if(!confirm('Đăng xuất? Hãy lưu nội dung đang chỉnh sửa trước.'))return;try{await api('/api/logout',{});location.reload();}catch(e){panel.hidden=false;tell(e.message,true);}}
form.addEventListener('submit',async event=>{event.preventDefault();loginButton.disabled=true;tell('Đang đăng nhập…');try{auth=await api('/api/login',{username:form.username.value,password:form.password.value});form.password.value='';await editor();}catch(e){tell(e.message,true);}finally{loginButton.disabled=false;}});
document.getElementById('logout').addEventListener('click',endSession);
(async()=>{loginButton.disabled=true;try{
 try{const c=await(await fetch('connection.json',{cache:'no-store'})).json();if(c.admin_url){const u=new URL(c.admin_url);if(u.protocol==='https:'&&u.hostname.endsWith('.workers.dev')&&u.origin!==location.origin){location.replace(u.href);return;}}}catch{}
 auth=await api('/api/session');await editor();}catch(e){
 if(e.status===401){tell('');loginButton.disabled=false;}
 else if(e.status===404){
  try{const c=await(await fetch('connection.json')).json();if(c.admin_url){const u=new URL(c.admin_url);if(u.protocol==='https:'&&u.hostname.endsWith('.workers.dev')){location.replace(u.href);return;}}}catch{}
  tell('Admin online chưa được kết nối. Hoàn tất cấu hình Cloudflare để đăng nhập.',true);
 }else{tell(e.message,true);}
}finally{if(auth)loginButton.disabled=false;}})();
