import 'dotenv/config';
import fs from 'node:fs';
import {runBenchmark} from './benchmark.js';
import {simulate,scenarios} from '../packages/simulator/src/index.js';
import {createApp} from '../apps/api/src/app.js';
if(!fs.existsSync('data/calibrator.json')||!fs.existsSync('data/benchmark.json'))await runBenchmark();
const service=createApp();for(const s of scenarios){const {telemetry,scoring}=simulate(s.id,42);if(service.store.get(telemetry.case_id))continue;service.store.create(telemetry,s.title);service.scoring.save(telemetry.case_id,scoring);await service.run(telemetry.case_id);}service.close();await import('../apps/api/src/index.js');
