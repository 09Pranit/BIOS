import { makeOp, type Op } from '../sync-core/src/index.js';
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
  return log;
}
