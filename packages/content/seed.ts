import { makeOp, type Op } from '../sync-core/src/index.js';

// Fixed fictional examples keep operation IDs and content identical across restarts.
export const demoPatients = [
  ['Harpreet Singh', '2026-10-28', '09:15', 'Routine consultation'],
  ['Kavita Sharma', '2026-10-28', '10:00', 'Blood pressure check'],
  ['Amanpreet Kaur', '2026-10-28', '11:20', 'Seasonal cough consultation'],
  ['Rakesh Kumar', '2026-10-29', '09:30', 'Follow-up visit'],
  ['Farah Ali', '2026-10-29', '10:45', 'General health check'],
  ['Gurdeep Singh', '2026-10-29', '12:10', 'Knee discomfort consultation'],
  ['Sunita Devi', '2026-10-30', '09:00', 'Nutrition counselling'],
  ['Navjot Kaur', '2026-10-30', '10:20', 'Headache consultation'],
  ['Mohit Verma', '2026-10-30', '11:40', 'Routine follow-up'],
  ['Parveen Begum', '2026-10-31', '09:10', 'Blood pressure follow-up'],
  ['Baljit Singh', '2026-10-31', '10:30', 'General consultation'],
  ['Ritu Malhotra', '2026-10-31', '12:00', 'Wellness check'],
] as const;

export function seedDoctorOperations(): Op[] {
  const log: Op[] = [];
  demoPatients.forEach(([patientName, date, time, purpose], i) => {
    log.push(
      makeOp(
        log,
        'seed-doctor-v1',
        'Synthetic demo',
        `demo-doctor-entry-${String(i + 1).padStart(3, '0')}`,
        'doctorEntry',
        { patientName, date, time, purpose: `${purpose}. Fictional demo patient.` },
        'add',
        'doctor-entry',
        1793448000000,
      ),
    );
  });
  return log;
}

export const demoChildren = [
  ['Aarohi Kaur', '6', 'Daun Kalan', 'Class 1'],
  ['Kabir Singh', '7', 'Daun Kalan', 'Class 2'],
  ['Meher Kaur', '8', 'Daun Kalan', 'Class 3'],
  ['Arjun Sharma', '6', 'Daun Kalan', 'Class 1'],
  ['Noor Kaur', '9', 'Daun Kalan', 'Class 4'],
  ['Vihaan Kumar', '7', 'Baran', 'Class 2'],
  ['Simran Kaur', '8', 'Baran', 'Class 3'],
  ['Ishaan Singh', '10', 'Daun Kalan', 'Class 5'],
  ['Anaya Devi', '6', 'Lang', 'Class 1'],
  ['Gurman Singh', '9', 'Lang', 'Class 4'],
  ['Diya Rani', '7', 'Daun Kalan', 'Class 2'],
  ['Rehaan Ali', '8', 'Baran', 'Class 3'],
  ['Avni Sharma', '6', 'Daun Kalan', 'Class 1'],
  ['Jasnoor Kaur', '10', 'Lang', 'Class 5'],
  ['Rudra Kumar', '9', 'Daun Kalan', 'Class 4'],
  ['Saanvi Kaur', '7', 'Lang', 'Class 2'],
  ['Amrit Singh', '8', 'Daun Kalan', 'Class 3'],
  ['Tara Devi', '6', 'Baran', 'Class 1'],
  ['Eknoor Kaur', '9', 'Daun Kalan', 'Class 4'],
  ['Yuvraj Singh', '10', 'Baran', 'Class 5'],
  ['Myra Rani', '7', 'Daun Kalan', 'Class 2'],
  ['Samar Ali', '8', 'Lang', 'Class 3'],
  ['Pihu Sharma', '6', 'Daun Kalan', 'Class 1'],
  ['Fateh Singh', '9', 'Lang', 'Class 4'],
];
export function seedOperations(): Op[] {
  let log: Op[] = [];
  const date = '2026-10-31';
  const add = (id: string, field: any, value: any, kind: any = 'set', type: any = 'child') => {
    log.push(makeOp(log, 'seed', 'Synthetic seed', id, field, value, kind, type, 1793400000000));
  };
  demoChildren.forEach(([name, age, village, grade], i) => {
    const id = `child-${String(i + 1).padStart(3, '0')}`;
    add(id, 'name', name);
    add(id, 'dob', `${2026 - Number(age)}-04-15`);
    add(id, 'village', village);
    add(id, 'class', grade);
    add(id, 'consent', true);
    add(id, 'tags', i % 3 === 0 ? 'Learning support' : 'Enrolled', 'add');
    if (i < 18)
      add(
        `${id}:${date}`,
        'attendance',
        i === 4 || i === 12 ? 'absent' : i === 7 ? 'late' : 'present',
        'set',
        'attendance',
      );
    if (i < 14)
      add(
        id,
        'visits',
        {
          date: '2026-10-28',
          note: 'Routine school health visit. Synthetic record.',
          worker: 'Gurpreet Kaur',
        },
        'add',
      );
    if (i < 10) add(id, 'growth', { date: '2026-10-28', weight: 18 + i * 0.8, height: 112 + i * 2 }, 'add');
    if (i < 12)
      add(
        id,
        'doses',
        { name: 'School health record', date: '2026-09-15', batch: 'DEMO-ONLY', site: 'Village clinic' },
        'add',
      );
    if (i < 8) add(`${id}:math-foundations:attempt-1`, 'score', 55 + i * 5, 'set', 'assessment');
  });
  return [...log, ...seedDoctorOperations()];
}
