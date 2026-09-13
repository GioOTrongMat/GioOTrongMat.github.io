import {enc,hex,unhex,random,digest,assert,HttpError} from './common.mjs';
const ttl=3600;
export async function makePasswordRecord(password,pepper){
 assert(password.length>=20&&password.length<=256,'Mật khẩu cần 20–256 ký tự.');
 const salt=hex(crypto.getRandomValues(new Uint8Array(16)));
 const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:unhex(salt),iterations:100000,hash:'SHA-256'},key,256);
 const signingKey=await crypto.subtle.importKey('raw',enc.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return JSON.stringify({salt,iterations:100000,verifier:hex(await crypto.subtle.sign('HMAC',signingKey,bits))});
}
export async function version(env){return digest(env.ADMIN_USERNAME+env.PASSWORD_RECORD+env.AUTH_PEPPER);}
async function checkPassword(password,env){
 const r=JSON.parse(env.PASSWORD_RECORD);assert(r.iterations===100000&&/^[a-f0-9]{32}$/.test(r.salt)&&/^[a-f0-9]{64}$/.test(r.verifier),'Cấu hình đăng nhập chưa hợp lệ.',503);
 const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:unhex(r.salt),iterations:r.iterations,hash:'SHA-256'},key,256);
 const signingKey=await crypto.subtle.importKey('raw',enc.encode(env.AUTH_PEPPER),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 return crypto.subtle.verify('HMAC',signingKey,unhex(r.verifier),bits);
}
function cookieName(request){return new URL(request.url).protocol==='https:'?'__Host-gio_session':'gio_local_session';}
export function cookie(request,token,maxAge=ttl){return `${cookieName(request)}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
export async function session(request,env){
 const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName(request)+'='))?.split('=')[1];
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 const hash=await digest(token);const row=await env.AUTH_DB.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires > ?').bind(hash,Date.now()).first();
 if(!row||row.credential_version!==await version(env))return null;return {...row,token_hash:hash};
}
export async function login(request,env,data){
 assert(typeof data.username==='string'&&data.username.length<=100&&typeof data.password==='string'&&data.password.length<=256,'Thông tin đăng nhập không hợp lệ.');
 const now=Date.now();const ip=request.headers.get('cf-connecting-ip')||'local';
 // Atomic counters in D1; a distributed attack is also bounded per account.
 for(const [name,limit] of [['ip:'+ip,5],['account',30]]){
  const bucket=await digest(name);const result=await env.AUTH_DB.prepare('INSERT INTO login_limits (bucket, attempts, expires) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = CASE WHEN expires <= ? THEN 1 ELSE attempts + 1 END, expires = CASE WHEN expires <= ? THEN excluded.expires ELSE expires END RETURNING attempts').bind(bucket,now+300000,now,now).first();
  assert(result.attempts<=limit,'Thử đăng nhập quá nhiều lần. Vui lòng chờ 5 phút.',429);
 }
 const valid=await checkPassword(data.password,env);
 assert(valid&&data.username===env.ADMIN_USERNAME,'Tên đăng nhập hoặc mật khẩu không đúng.',401);
 const token=random(),csrf=random(),expires=now+ttl*1000;
 const old=await session(request,env);if(old)await env.AUTH_DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(old.token_hash).run();
 await env.AUTH_DB.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?, ?)').bind(await digest(token),env.ADMIN_USERNAME,csrf,expires,await version(env)).run();
 await env.AUTH_DB.prepare('DELETE FROM sessions WHERE expires <= ?').bind(now).run();
 await env.AUTH_DB.prepare('DELETE FROM login_limits WHERE expires <= ?').bind(now).run();
 return {token,csrf,expires,username:env.ADMIN_USERNAME};
}
export async function logout(env,s){await env.AUTH_DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(s.token_hash).run();}
