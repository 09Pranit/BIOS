import {it,expect,vi} from 'vitest';
import {createServer} from 'node:http';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {verifyMojoToken} from '../apps/api/src/adapters/mojoauth.js';
it('verifies signed issuer/audience/expiry claims against discovery JWKS and server role allowlist',async()=>{
 const {publicKey,privateKey}=await generateKeyPair('RS256');const jwk={...await exportJWK(publicKey),kid:'test-key',alg:'RS256',use:'sig'};let issuer='';const server=createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.url?.includes('openid-configuration')?{issuer,authorization_endpoint:issuer+'/authorize',token_endpoint:issuer+'/token',jwks_uri:issuer+'/jwks'}:{keys:[jwk]}));});await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));issuer=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
 vi.stubEnv('MOJOAUTH_ISSUER',issuer);vi.stubEnv('MOJOAUTH_CLIENT_ID','test-audience');vi.stubEnv('MOJOAUTH_REVIEWER_SUBJECTS','operator-1');
 try{const sign=(aud='test-audience',expired=false)=>new SignJWT({}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer(issuer).setAudience(aud).setSubject('operator-1').setIssuedAt().setExpirationTime(expired?1:'5m').sign(privateKey);expect(await verifyMojoToken(await sign())).toEqual({user:'operator-1',role:'Reviewer'});await expect(verifyMojoToken(await sign('wrong-audience'))).rejects.toThrow();await expect(verifyMojoToken(await sign('test-audience',true))).rejects.toThrow();await expect(verifyMojoToken('unsigned.fake.token')).rejects.toThrow();}finally{vi.unstubAllEnvs();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
