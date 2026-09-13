window.CMS_MANUAL_INIT=true;
let auth=null,started=false,revision=null;
const panel=document.getElementById('login-panel');const form=document.getElementById('login-form');const message=document.getElementById('message');const loginButton=document.getElementById('login-button');
function tell(text,error=false){message.textContent=text;message.className=error?'error':'';}
async function api(path,body){
 const response=await fetch(path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':auth?.csrf||''},body:body===undefined?undefined:JSON.stringify(body)});
 let data;try{data=await response.json();}catch{throw Object.assign(new Error('Chưa kết nối được backend đăng nhập.'),{status:response.status});}
 if(!response.ok){if(response.status===401&&started){panel.hidden=false;tell('Phiên đã hết hạn. Đăng nhập lại để giữ và lưu phần đang chỉnh sửa.',true);}throw Object.assign(new Error(data.error||'Không thể xử lý yêu cầu.'),{status:response.status});}return data;
}
function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(new Error('Không tải được trình biên tập. Hãy tải lại trang.'));document.head.append(el);});}
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
    const result=await api('/api/v1',{...payload,revision});
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
