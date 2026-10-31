export const policies = {
  name: ['register', 'NEEDS_REVIEW'],
  dob: ['register', 'NEEDS_REVIEW'],
  gender: ['register', 'NEEDS_REVIEW'],
  guardian: ['register', 'NEEDS_REVIEW'],
  phone: ['register', 'NEEDS_REVIEW'],
  consent: ['register', 'NEEDS_REVIEW'],
  attendance: ['register', 'NEEDS_REVIEW'],
  score: ['register', 'NEEDS_REVIEW'],
  doseStatus: ['register', 'NEEDS_REVIEW'],
  allergy: ['register', 'NEEDS_REVIEW'],
  prescription: ['register', 'NEEDS_REVIEW'],
  deleted: ['tombstone', 'NEEDS_REVIEW'],
  visits: ['grow-set', 'SAFE_AUTO'],
  doses: ['grow-set', 'SAFE_AUTO'],
  growth: ['grow-set', 'SAFE_AUTO'],
  attempts: ['grow-set', 'SAFE_AUTO'],
  progress: ['grow-set', 'SAFE_AUTO'],
  tags: ['or-set', 'SAFE_AUTO'],
  stock: ['pn-counter', 'SAFE_AUTO'],
  village: ['register', 'NEEDS_REVIEW'],
  class: ['register', 'NEEDS_REVIEW'],
} as const;
export type Field = keyof typeof policies;
export const reasonFor = (field: string) =>
  field === 'deleted'
    ? 'A deletion and an edit happened independently. Both must be reviewed before the record changes.'
    : `Two people changed ${field} without seeing each other’s work. A clock cannot decide which account is correct.`;
