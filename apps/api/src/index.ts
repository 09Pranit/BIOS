import 'dotenv/config';
import {flushTracing} from './adapters/langfuse.js';
import {createApp} from './app.js';
const service=createApp();const port=Number(process.env.PORT||3001);const server=service.app.listen(port,'0.0.0.0',()=>console.log(`ServiceShield API ready on http://localhost:${port}`));
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>server.close(()=>{service.close();void flushTracing().finally(()=>process.exit(0));}));
