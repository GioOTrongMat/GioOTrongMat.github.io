import {assert,HttpError,readJSON,sameOrigin,readablePath,mediaPath,validateContent,decodeAsset,enc} from './common.mjs';
import {session,login,logout,cookie} from './auth.mjs';
import {GitHubStore,b64} from './github.mjs';
const json=(value,status=200,headers={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const types={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',mp4:'video/mp4',pdf:'application/pdf'};
export function createWorker(factory=env=>new GitHubStore(env)){
 return {async fetch(request,env){
  try{
   const u=new URL(request.url);const api=u.pathname.startsWith('/api/');
   if(!api){
    const response=await env.ASSETS.fetch(request);const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');headers.set('X-Frame-Options','DENY');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; media-src 'self' blob: https:; connect-src 'self' https://giootrongmat.github.io; font-src 'self' data:; frame-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");return new Response(response.body,{status:response.status,headers});
   }
   assert(u.protocol==='https:'||['localhost','127.0.0.1'].includes(u.hostname),'Cần HTTPS.',403);
   assert(env.ADMIN_USERNAME&&env.PASSWORD_RECORD&&env.AUTH_PEPPER?.length>=32&&env.AUTH_DB,'Backend chưa được cấu hình đầy đủ.',503);
   if(request.method==='POST')sameOrigin(request);
   if(u.pathname==='/api/login'&&request.method==='POST'){
    const result=await login(request,env,await readJSON(request,2048));return json({username:result.username,csrf:result.csrf,expires:result.expires},200,{'Set-Cookie':cookie(request,result.token)});
   }
   const s=await session(request,env);assert(s,'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',401);
   if(u.pathname==='/api/session'&&request.method==='GET')return json({username:s.username,csrf:s.csrf,expires:s.expires});
   if(request.method==='POST')assert(request.headers.get('x-csrf-token')===s.csrf,'Phiên xác thực không hợp lệ.',403);
   if(u.pathname==='/api/logout'&&request.method==='POST'){await logout(env,s);return json({ok:true},200,{'Set-Cookie':cookie(request,'',0)});}
   const store=factory(env);
   if(u.pathname==='/api/media'&&request.method==='GET'){
    const file=await store.read(readablePath(u.searchParams.get('path')));const type=types[file.path.split('.').pop().toLowerCase()];assert(type,'Không phải file media.',403);
    return new Response(file.bytes,{headers:{'Content-Type':type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Content-Disposition':'inline'}});
   }
   assert(u.pathname==='/api/v1'&&request.method==='POST','Không tìm thấy API.',404);
   const payload=await readJSON(request,15*1024*1024);const p=payload.params||{};
   if(payload.branch)assert(payload.branch===env.GITHUB_BRANCH,'Nhánh không được phép.',403);if(p.branch)assert(p.branch===env.GITHUB_BRANCH,'Nhánh không được phép.',403);
   const entry=async(path,label)=>{assert(path==='content/site.json','Chỉ quản lý content/site.json.',403);const file=await store.read(path);return {data:new TextDecoder().decode(file.bytes),file:{path,label,id:file.sha}};};
   const media=async path=>{const file=await store.read(readablePath(path));assert(file.path!=='content/site.json','Không phải media.',403);return {id:file.sha,path:file.path,name:file.path.split('/').pop(),content:b64(file.bytes),encoding:'base64'};};
   switch(payload.action){
    case 'info':return json({repo:env.GITHUB_REPO,publish_modes:['simple'],type:'git'});
    case 'entriesByFiles':assert(Array.isArray(p.files)&&p.files.length===1,'Danh sách file không hợp lệ.');return json(await Promise.all(p.files.map(f=>entry(f.path,f.label))));
    case 'getEntry':return json(await entry(p.path));
    case 'getMedia':{
     assert(p.mediaFolder==='uploads','Thư mục không được phép.',403);const state=await store.snapshot();const files=[...state.files.values()].filter(f=>/^uploads\/[^/]+\.(png|jpe?g|gif|webp|mp4|pdf)$/i.test(f.path));
     return json(files.map(f=>({id:f.sha,path:f.path,name:f.path.split('/').pop(),size:f.size,url:'/api/media?path='+encodeURIComponent(f.path),displayURL:'/api/media?path='+encodeURIComponent(f.path)})));
    }
    case 'getMediaFile':return json(await media(p.path));
    case 'persistEntry':{
     const files=p.dataFiles||[p.entry];assert(files.length===1&&files[0]?.path==='content/site.json'&&!files[0].newPath,'Chỉ được lưu nội dung website.',403);
     const raw=validateContent(files[0].raw);const assets=p.assets||[];assert(Array.isArray(assets)&&assets.length<=9,'Tối đa 9 file đính kèm mỗi lần lưu.');
     const changes=[{path:'content/site.json',bytes:enc.encode(raw)},...assets.map(a=>({path:mediaPath(a.path),bytes:decodeAsset(a)}))];assert(new Set(changes.map(c=>c.path)).size===changes.length,'Tên file bị trùng.');
     const state=await store.snapshot();assert(typeof payload.revision==='string'&&payload.revision===state.files.get('content/site.json')?.sha,'Nội dung đã được sửa từ thiết bị khác. Tải lại trước khi lưu.',409);
     return json(await store.commit(changes,state,'Update portfolio content'));
    }
    case 'persistMedia':{
     const path=mediaPath(p.asset?.path);const bytes=decodeAsset(p.asset);const state=await store.snapshot();assert(!state.files.has(path),'Tên file đã có. Chọn tên mới để tránh ghi đè.',409);await store.commit([{path,bytes}],state,'Upload portfolio media');return json(await media(path));
    }
    case 'deleteFile':case 'deleteFiles':{
     const paths=payload.action==='deleteFile'?[p.path]:p.paths;assert(Array.isArray(paths)&&paths.length>0&&paths.length<=10,'Mỗi lần xóa tối đa 10 file.');paths.forEach(mediaPath);const state=await store.snapshot();const content=JSON.parse(new TextDecoder().decode((await store.read('content/site.json',state)).bytes));const strings=[];const walk=x=>{if(typeof x==='string')strings.push(x);else if(x&&typeof x==='object')Object.values(x).forEach(walk);};walk(content);
     for(const path of paths){assert(state.files.has(path),'File không tồn tại.',404);assert(!strings.some(s=>s===path||s==='/'+path||s.endsWith('/'+path)),'File đang được dùng. Thay file trong nội dung và lưu trước khi xóa.',409);}
     return json(await store.commit(paths.map(path=>({path,bytes:null})),state,'Remove unused portfolio media'));
    }
    case 'getDeployPreview':return json(null);
    case 'getNotes':return json({notes:[]});
    case 'getPRMetadata':return json({metadata:null});
    default:throw new HttpError(403,'Thao tác không được phép.');
   }
  }catch(error){if(!(error instanceof HttpError))console.error('worker:exception',{name:error?.name,message:error?.message,stack:error?.stack});return json({error:error instanceof HttpError?error.message:'Không thể xử lý yêu cầu. Kiểm tra cấu hình backend.'},error instanceof HttpError?error.status:500);}
 }};
}
export default createWorker();

