import {assert,HttpError,enc,readablePath,mediaPath} from './common.mjs';
const b64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
export class GitHubStore {
 constructor(env,fetcher=(...args)=>fetch(...args)){this.env=env;this.fetcher=fetcher;}
 async api(path,method='GET',data){
  const r=await this.fetcher(`https://api.github.com/repos/${this.env.GITHUB_REPO}${path}`,{method,headers:{Authorization:`Bearer ${this.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Gio-Portfolio-Admin','Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  if(!r.ok){if(r.status===409||r.status===422)throw new HttpError(409,'Repository vừa thay đổi. Tải lại nội dung trước khi lưu.');if(r.status===404)throw new HttpError(404,'Không tìm thấy file hoặc repository.');throw new HttpError(502,'Không kết nối được GitHub. Kiểm tra quyền và hạn dùng token.');}
  return r.status===204?null:r.json();
 }
 async snapshot(){
  console.log('snapshot:start');
  const ref=await this.api('/git/ref/heads/'+encodeURIComponent(this.env.GITHUB_BRANCH));
  console.log('ref:ok');
  const commit=await this.api('/git/commits/'+ref.object.sha);
  console.log('commit:ok');
  const tree=await this.api('/git/trees/'+commit.tree.sha+'?recursive=1');assert(!tree.truncated,'Repository quá lớn để quản lý bằng cấu hình hiện tại.',413);
  console.log('tree:ok');
  return {head:ref.object.sha,tree:commit.tree.sha,files:new Map(tree.tree.filter(f=>f.type==='blob').map(f=>[f.path,f]))};
 }
 async read(path,snapshot){
  path=readablePath(path);const state=snapshot||await this.snapshot();const item=state.files.get(path);assert(item,'Không tìm thấy file.',404);assert(item.size<=5*1024*1024,'File quá lớn để mở trong admin.',413);
  const blob=await this.api('/git/blobs/'+item.sha);assert(blob.encoding==='base64','Định dạng GitHub không hỗ trợ.',502);
  const bytes=Uint8Array.from(atob(blob.content.replace(/\s/g,'')),c=>c.charCodeAt(0));return {path,sha:item.sha,bytes};
 }
 async commit(changes,state,message){
  assert(changes.length>0&&changes.length<=10,'Mỗi lần lưu tối đa 10 file.');
  const tree=[];
  for(const change of changes){
   if(change.path!=='content/site.json')mediaPath(change.path);
   if(change.bytes===null){tree.push({path:change.path,mode:'100644',type:'blob',sha:null});continue;}
   const blob=await this.api('/git/blobs','POST',{content:b64(change.bytes),encoding:'base64'});tree.push({path:change.path,mode:'100644',type:'blob',sha:blob.sha});
  }
  const nextTree=await this.api('/git/trees','POST',{base_tree:state.tree,tree});
  const commit=await this.api('/git/commits','POST',{message,tree:nextTree.sha,parents:[state.head]});
  await this.api('/git/refs/heads/'+encodeURIComponent(this.env.GITHUB_BRANCH),'PATCH',{sha:commit.sha,force:false});
  return {commit:commit.sha,revision:tree.find(x=>x.path==='content/site.json')?.sha};
 }
}
export {b64};
