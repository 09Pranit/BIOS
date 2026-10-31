import 'dotenv/config';
import {simulate,scenarios} from '../packages/simulator/src/index.js';
import {createApp} from '../apps/api/src/app.js';
const service=createApp();for(const s of scenarios){const {telemetry,scoring}=simulate(s.id,42);if(service.store.get(telemetry.case_id)){service.store.db.prepare('UPDATE cases SET telemetry=?,title=?,status=?,result=NULL,approved_by=NULL,published=0 WHERE id=?').run(JSON.stringify(telemetry),s.title,'queued',telemetry.case_id);service.store.audit(telemetry.case_id,'seed-script','fixture-refreshed');}else service.store.create(telemetry,s.title);service.scoring.save(telemetry.case_id,scoring);await service.run(telemetry.case_id);console.log(`Seeded ${telemetry.case_id}`);}service.close();
