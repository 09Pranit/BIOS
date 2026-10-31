export const adapterHealth:Record<string,{state:string;last_attempt:string;detail:string}>={};
export function health(name:string,state:string,detail:string){adapterHealth[name]={state,last_attempt:new Date().toISOString(),detail};}
