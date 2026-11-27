import heroVillaImg from '../assets/images/hero_renovation_villa_1795804094803.jpg';
import ceramicArtisanImg from '../assets/images/ceramic_tiling_artisan_1795804095323.jpg';
import beforeConstructionImg from '../assets/images/before_raw_construction_1795804095303.jpg';
import afterFinishedImg from '../assets/images/after_finished_luxury_1795804095333.jpg';
import exteriorFacadeImg from '../assets/images/exterior_facade_stone_1795804096106.jpg';
import kitchenMarbleImg from '../assets/images/kitchen_marble_ceramic_1795804096407.jpg';

export type ProjectCategory =
  | 'ceramics'
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
  createdAtMs?: number;
}

export const CATEGORY_LABELS: Record<ProjectCategory | 'all', string> = {
  all: 'جميع الأعمال',
  ceramics: 'سيراميك وبورسلان',
  construction: 'بناء وتشييد',
  renovation: 'ترميم وتجديد',
  kitchen_bath: 'مطابخ وحمامات',
  facades: 'واجهات وحجر',
};

export const GENERATED_ASSETS = {
  heroVilla: heroVillaImg,
  ceramicArtisan: ceramicArtisanImg,
  beforeConstruction: beforeConstructionImg,
  afterFinished: afterFinishedImg,
  exteriorFacade: exteriorFacadeImg,
  kitchenMarble: kitchenMarbleImg,
};

export const SHOWCASE_STAGES = [
  {
    src: GENERATED_ASSETS.heroVilla,
    alt: 'تجديد غرفة معيشة فاخرة ببلاط البورسلان الترافرتين الكبير',
    title: 'تشطيب معماري وبورسلان فاخر',
    sub: 'تبليط مساحات واسعة بألواح الترافرتين والبورسلان الإسباني بدقة مليمترية',
  },
  {
    src: GENERATED_ASSETS.ceramicArtisan,
    alt: 'تركيب سيراميك وبورسلان بعروق الرخام مع فواصل دقيقة',
    title: 'تركيب السيراميك بالليزر',
    sub: 'فواصل 1 ملم متساوية وتثبيت بمشابك التسوية لضمان استواء مثالي للأرضيات',
  },
  {
    src: GENERATED_ASSETS.kitchenMarble,
    alt: 'مطبخ حديث بألواح البورسلان الكالاكاتا والخشب الداكن',
    title: 'مطابخ وأسطح كالاكاتا',
    sub: 'تجديد شامل للمطابخ والحمامات بأسطح البورسلان المقاومة للحرارة والخدش',
  },
  {
    src: GENERATED_ASSETS.exteriorFacade,
    alt: 'واجهة فيلا عصرية مكسوة بالحجر الطبيعي وبلاط التراس',
    title: 'بناء وتكسية الواجهات',
    sub: 'أعمال البناء الهيكلي، التلبيس المعماري، وتكسية الحجر الطبيعي وبلاط التراسات',
  },
];

export const CURATED_PROJECTS: ProjectRecord[] = [
  {
    id: 'curated-hydra-villa',
    title: 'تبليط وتجديد صالون فيلا بالبورسلان الترافرتين',
    category: 'ceramics',
    location: 'حيدرة، الجزائر العاصمة',
    areaSqm: '210 م²',
    description:
      'مشروع تجديد شامل لطابق أرضي بفيلا سكنية مع تركيب ألواح بورسلان مقاس 120×120 سم بتشطيب ترافرتين طبيعي، وإعادة تهيئة الأسقف الجبسية مع الإضاءة المخفية والواجهات الزجاجية.',
    coverImage: GENERATED_ASSETS.heroVilla,
    ownerId: 'curated',
    ownerName: 'اخدم دارك dz darkom pro',
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
    title: 'ترميم وتأهيل شقة من الطوب الأحمر إلى التسليم المفتاحي',
    category: 'renovation',
    location: 'بئر الجير، وهران',
    areaSqm: '140 م²',
    description:
      'إعادة بناء وتوزيع الفضاء الداخلي لشقة سكنية انطلاقاً من مرحلة الأشغال الكبرى والطوب الأحمر وصولاً إلى التلبيس، التمديدات الصحية والكهربائية، وتركيب البورسلان اللامع.',
    coverImage: GENERATED_ASSETS.afterFinished,
    ownerId: 'curated',
    ownerName: 'اخدم دارك dz darkom pro',
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
    title: 'تصميم وتبليط مطبخ عصري بألواح الكالاكاتا',
    category: 'kitchen_bath',
    location: 'دالي إبراهيم، الجزائر العاصمة',
    areaSqm: '38 م²',
    description:
      'تركيب ألواح سيراميك وبورسلان كالاكاتا الكبيرة للجدران وجزيرة المطبخ الوسطية مع تناسق العروق الرخامية وأرضيات مصقولة سهلة التنظيف.',
    coverImage: GENERATED_ASSETS.kitchenMarble,
    ownerId: 'curated',
    ownerName: 'اخدم دارك dz darkom pro',
    isCurated: true,
  },
  {
    id: 'curated-facade-bejaia',
    title: 'بناء وتكسية واجهة فيلا ساحلية بالحجر الطبيعي',
    category: 'facades',
    location: 'بجاية',
    areaSqm: '340 م²',
    description:
      'أشغال البناء والتشطيب الخارجي شاملة تكسية الأعمدة بالحجر الطبيعي المقاوم للرطوبة، طلاء الواجهات المعماري، وتبليط التراس ببلاط بورسلان خارجي مانع للانزلاق.',
    coverImage: GENERATED_ASSETS.exteriorFacade,
    ownerId: 'curated',
    ownerName: 'اخدم دارك dz darkom pro',
    isCurated: true,
  },
  {
    id: 'curated-porcelain-hall',
    title: 'تركيب بورسلان رخامي مقاس كبير مع فواصل نحاسية',
    category: 'ceramics',
    location: 'سطيف',
    areaSqm: '165 م²',
    description:
      'تنفيذ دقيق لأرضيات الاستقبال والممرات باستخدام مشابك التسوية بالليزر والفواصل النحاسية الرفيعة لضمان استمرارية العروق دون أي تفاوت في الارتفاع.',
    coverImage: GENERATED_ASSETS.ceramicArtisan,
    ownerId: 'curated',
    ownerName: 'اخدم دارك dz darkom pro',
    isCurated: true,
  },
  {
    id: 'curated-structural-build',
    title: 'أشغال البناء والهيكل الداخلي وتهيئة الجدران',
    category: 'construction',
    location: 'قسنطينة',
    areaSqm: '260 م²',
    description:
      'بناء الجدران الفاصلة بالطوب الأحمر المزدوج، تنفيذ تسوية الأرضيات (Chape) وتأسيس الشبكات التقنية بدقة تمهيداً لمرحلة التلبيس والسيراميك.',
    coverImage: GENERATED_ASSETS.beforeConstruction,
    ownerId: 'curated',
    ownerName: 'اخدم دارك dz darkom pro',
    isCurated: true,
  },
];
