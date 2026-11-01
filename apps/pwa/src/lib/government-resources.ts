import education from '../../../../packages/content/government-education.json';

export type GovernmentResource = {
  id: string;
  title: string;
  category: 'Education';
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
export const governmentResources: GovernmentResource[] = education.map((item): GovernmentResource => ({
  ...item,
  category: 'Education',
}));
