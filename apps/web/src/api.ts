export async function api<T=any>(url:string,options:RequestInit={}):Promise<T>{const response=await fetch(`/api${url}`,{credentials:'include',...options,headers:{'Content-Type':'application/json',...options.headers}});const body=await response.json();if(!response.ok)throw new Error(body.error||`Request failed (${response.status})`);return body;}
export const post=<T=any>(url:string,body:unknown={})=>api<T>(url,{method:'POST',body:JSON.stringify(body)});
export const pct=(n:number)=>`${Math.round(n*100)}%`;
export const clock=(n:number)=>new Date(n).toISOString().slice(11,23);
