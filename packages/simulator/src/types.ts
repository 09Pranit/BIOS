export const services = ['api-gateway','identity-service','appointment-service','payments-service','records-db','notification-gateway','bank-adapter'] as const;
export type Service = typeof services[number];
export type Interval = [number, number];
export const topology: [Service,Service][] = [['api-gateway','identity-service'],['api-gateway','appointment-service'],['api-gateway','payments-service'],['appointment-service','records-db'],['appointment-service','notification-gateway'],['payments-service','records-db'],['payments-service','bank-adapter']];
export interface Stress { clockOffset: number; drift: number; logLoss: number; burstLoss: boolean; traceDrop: number; timestampMix: boolean; noise: number }
export const defaultStress: Stress = { clockOffset: 15, drift: 20, logLoss: 15, burstLoss: false, traceDrop: 20, timestampMix: true, noise: 15 };
export interface RawRecord { event_id: string; service: Service; raw_ts: string | number; raw_line: string; source_file: string; line: number; format: 'json'|'logfmt'|'pipe' }
export interface Fields { kind: 'log'|'metric'|'change'; seq: number; op: string; phase?: 'send'|'receive'|'reply'|'complete'; peer?: Service; request?: string; trace?: string; level: string; message: string; metric?: string; value?: number; status?: number; hint?: string }
export interface Telemetry { case_id: string; records: RawRecord[]; topology: [Service,Service][]; workload: { t: number; requests: number }[]; clockReference: Service; duration: number; start: number; stress: Stress }
export type FaultClass = 'pool-exhaustion'|'external-outage'|'certificate-expiry'|'blocking-slowdown'|'memory-leak';
export interface Fault { component: Service; fault: FaultClass; onset: number; magnitude?: number }
export interface ScoringTruth { faults: Fault[]; offsets: Record<Service,{ offset: number; drift: number }>; event_times: Record<string,number>; relevant_ids: string[]; causal_order: string[] }
export interface Scenario { id: string; title: string; description: string; faults: Fault[] }
