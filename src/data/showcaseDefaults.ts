import heroVillaImg from '../assets/images/hero_renovation_villa_1795804094803.jpg';
import ceramicArtisanImg from '../assets/images/ceramic_tiling_artisan_1795804095323.jpg';
import beforeConstructionImg from '../assets/images/before_raw_construction_1795804095303.jpg';
import afterFinishedImg from '../assets/images/after_finished_luxury_1795804095333.jpg';
import exteriorFacadeImg from '../assets/images/exterior_facade_stone_1795804096106.jpg';
import kitchenMarbleImg from '../assets/images/kitchen_marble_ceramic_1795804096407.jpg';
import type { ServiceCategoryId } from './i18n';

export type ProjectCategory =
  | ServiceCategoryId
  | 'construction'
  | 'renovation'
  | 'kitchen_bath'
  | 'facades';

export interface ProjectPhotoItem {
  id: string;
  imageUrl: string;
  caption: string;
  ownerId: string;
}

export interface ProjectRecord {
  id: string;
  title: string;
  category: ProjectCategory;
  location: string;
  areaSqm: string;
  description: string;
  coverImage: string;
  ownerId: string;
  ownerName: string;
  isCurated?: boolean;
  extraPhotos?: { imageUrl: string; caption: string }[];
}

export interface ArtisanRecord {
  id: string;
  displayName: string;
  profession: ServiceCategoryId;
  experienceYears: number;
  wilaya: string;
  commune: string;
  bio: string;
  avatarUrl: string;
  ownerId: string;
}

export interface ServiceRequestRecord {
  id: string;
  title: string;
  category: ServiceCategoryId;
  wilaya: string;
  commune: string;
  description: string;
  coverImage: string;
  status: 'open' | 'in_progress' | 'closed';
  ownerId: string;
  ownerName: string;
}

export interface InquiryRecord {
  id: string;
  senderId: string;
  senderName: string;
  recipientOwnerId: string;
  recipientName: string;
  contextType: 'artisan' | 'request';
  contextId: string;
  contextTitle: string;
  message: string;
  contactInfo: string;
  replyText: string;
  status: 'pending' | 'replied';
  createdAtMs: number;
}

export const GENERATED_ASSETS = {
  heroVilla: heroVillaImg,
  ceramicArtisan: ceramicArtisanImg,
  beforeConstruction: beforeConstructionImg,
  afterFinished: afterFinishedImg,
  exteriorFacade: exteriorFacadeImg,
  kitchenMarble: kitchenMarbleImg,
};

export const CURATED_PROJECTS: ProjectRecord[] = [
  {
    id: 'curated-hydra-villa',
    title: 'نموذج مرجعي: تبليط وتجديد صالون فيلا بالبورسلان الترافرتين',
    category: 'ceramics',
    location: 'حيدرة، الجزائر العاصمة',
    areaSqm: '210 م²',
    description:
      'نموذج مرجعي لتجديد طابق أرضي بفيلا سكنية مع تركيب ألواح بورسلان مقاس 120×120 سم بتشطيب ترافرتين طبيعي، وإعادة تهيئة الأسقف الجبسية مع الإضاءة المخفية.',
    coverImage: GENERATED_ASSETS.heroVilla,
    ownerId: 'curated',
    ownerName: 'نماذج استوديو اخدم دارك',
    isCurated: true,
    extraPhotos: [
      {
        imageUrl: GENERATED_ASSETS.ceramicArtisan,
        caption: 'تفاصيل التقاء الأرضيات مع الفواصل المعدنية الدقيقة',
      },
      {
        imageUrl: GENERATED_ASSETS.afterFinished,
        caption: 'إطلالة شاملة على الصالون بعد التسليم النهائي',
      },
    ],
  },
  {
    id: 'curated-oran-apartment',
    title: 'نموذج مرجعي: ترميم وتأهيل شقة من الطوب الأحمر إلى التسليم',
    category: 'construction_renovation',
    location: 'بئر الجير، وهران',
    areaSqm: '140 م²',
    description:
      'نموذج مرجعي لإعادة بناء وتوزيع الفضاء الداخلي لشقة سكنية انطلاقاً من مرحلة الأشغال الكبرى والطوب الأحمر وصولاً إلى التلبيس، التمديدات الصحية والكهربائية، وتركيب البورسلان.',
    coverImage: GENERATED_ASSETS.afterFinished,
    ownerId: 'curated',
    ownerName: 'نماذج استوديو اخدم دارك',
    isCurated: true,
    extraPhotos: [
      {
        imageUrl: GENERATED_ASSETS.beforeConstruction,
        caption: 'حالة الشقة قبل بدء أشغال الترميم والتبليط',
      },
    ],
  },
  {
    id: 'curated-kitchen-calacatta',
    title: 'نموذج مرجعي: تصميم وتبليط مطبخ عصري بألواح الكالاكاتا',
    category: 'ceramics',
    location: 'دالي إبراهيم، الجزائر العاصمة',
    areaSqm: '38 م²',
    description:
      'نموذج مرجعي لتركيب ألواح سيراميك وبورسلان كالاكاتا الكبيرة للجدران وجزيرة المطبخ الوسطية مع تناسق العروق الرخامية وأرضيات مصقولة.',
    coverImage: GENERATED_ASSETS.kitchenMarble,
    ownerId: 'curated',
    ownerName: 'نماذج استوديو اخدم دارك',
    isCurated: true,
  },
  {
    id: 'curated-facade-bejaia',
    title: 'نموذج مرجعي: بناء وتكسية واجهة فيلا ساحلية بالحجر الطبيعي',
    category: 'construction_renovation',
    location: 'بجاية',
    areaSqm: '340 م²',
    description:
      'نموذج مرجعي لأشغال البناء والتشطيب الخارجي شاملة تكسية الأعمدة بالحجر الطبيعي المقاوم للرطوبة وتبليط التراس ببلاط خارجي مانع للانزلاق.',
    coverImage: GENERATED_ASSETS.exteriorFacade,
    ownerId: 'curated',
    ownerName: 'نماذج استوديو اخدم دارك',
    isCurated: true,
  },
];
