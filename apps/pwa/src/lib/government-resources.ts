import education from '../../../../packages/content/government-education.json';

export type GovernmentResource = {
  id: string;
  title: string;
  category: 'Education' | 'Health & wellbeing';
  provider: string;
  description: string;
  href: string;
  image: string;
  imageAlt: string;
  imageSource: string;
  rightsUrl: string;
  rightsNote: string;
  offlineImage: boolean;
  audience: string;
  tags: string[];
  lastVerifiedDate: string;
  imageMimeType?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageBytes?: number;
};
const health: GovernmentResource[] = [
  {
    id: 'rbsk',
    title: 'Rashtriya Bal Swasthya Karyakram',
    category: 'Health & wellbeing',
    provider: 'National Health Mission, Ministry of Health & Family Welfare, Government of India',
    description:
      'Explore the National Health Mission’s child-health programme information and resources for families and community teams.',
    href: 'https://nhm.gov.in/index1.php?lang=1&level=4&lid=583&sublinkid=1190',
    image: '/government/rbsk.jpg',
    imageAlt: 'Official National Health Mission photograph for its child-health programme',
    imageSource: 'https://nhm.gov.in/images/New-nhm/Success-stories-4.jpg',
    rightsUrl: 'https://nhm.gov.in/index4.php?lang=1&level=0&lid=13&linkid=8',
    rightsNote:
      'Reproduced with prominent acknowledgement to National Health Mission under its website policy. No misleading use or third-party rights transfer; no endorsement of Smriva is implied.',
    offlineImage: true,
    audience: 'Families, educators and community health workers',
    tags: ['Child health', 'Community care', 'Family resources'],
    lastVerifiedDate: '2026-10-31',
  },
  {
    id: 'rksk',
    title: 'Rashtriya Kishor Swasthya Karyakram',
    category: 'Health & wellbeing',
    provider: 'National Health Mission, Ministry of Health & Family Welfare, Government of India',
    description:
      'Official adolescent-health information, educational materials and programme resources from the National Health Mission.',
    href: 'https://nhm.gov.in/index1.php?lang=1&level=2&lid=221&sublinkid=818',
    image: '/government/rksk.jpg',
    imageAlt: 'Official National Health Mission photograph for its adolescent-health programme',
    imageSource: 'https://nhm.gov.in/images/New-nhm/Success-stories-3.jpg',
    rightsUrl: 'https://nhm.gov.in/index4.php?lang=1&level=0&lid=13&linkid=8',
    rightsNote:
      'Reproduced with prominent acknowledgement to National Health Mission under its website policy. No misleading use or third-party rights transfer; no endorsement of Smriva is implied.',
    offlineImage: true,
    audience: 'Adolescents, families, educators and community workers',
    tags: ['Adolescent wellbeing', 'Health education', 'Community support'],
    lastVerifiedDate: '2026-10-31',
  },
];
export const governmentResources: GovernmentResource[] = [
  ...education.map((item): GovernmentResource => ({ ...item, category: 'Education' })),
  ...health,
];
