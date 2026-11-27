import heroVillaImg from '../assets/images/hero_renovation_villa_1795804094803.jpg';
import ceramicArtisanImg from '../assets/images/ceramic_tiling_artisan_1795804095323.jpg';
import beforeConstructionImg from '../assets/images/before_raw_construction_1795804095303.jpg';
import afterFinishedImg from '../assets/images/after_finished_luxury_1795804095333.jpg';
import exteriorFacadeImg from '../assets/images/exterior_facade_stone_1795804096106.jpg';
import kitchenMarbleImg from '../assets/images/kitchen_marble_ceramic_1795804096407.jpg';
import weldingCraftImg from '../assets/images/welding_metalwork_craft_1795808273381.jpg';
import electricalMepImg from '../assets/images/electrical_mep_install_1795808274195.jpg';
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
  beforeImage?: string;
  completedServices?: string[];
  artisanId?: string;
  ownerId: string;
  ownerName: string;
  isCurated?: boolean;
  extraPhotos?: { imageUrl: string; caption: string }[];
}

export interface ArtisanRecord {
  id: string;
  displayName: string;
  roleTitle?: string;
  profession: ServiceCategoryId;
  experienceYears: number;
  wilaya: string;
  commune: string;
  bio: string;
  skillsList?: string[];
  avatarUrl: string;
  ownerId: string;
  isCurated?: boolean;
}

export type SkillLevelId = 'expert' | 'advanced' | 'certified';

export interface TeamSkillRecord {
  id: string;
  nameAr: string;
  nameFr: string;
  category: ServiceCategoryId;
  level: SkillLevelId;
  summaryAr: string;
  summaryFr: string;
  toolsAr: string;
  sortOrder: number;
  ownerId: string;
  isCurated?: boolean;
}

export interface TeamServiceGuideRecord {
  id: string;
  titleAr: string;
  titleFr: string;
  category: ServiceCategoryId;
  natureAr: string;
  natureFr: string;
  deliverablesAr: string;
  deliverablesFr: string;
  stagesAr: string;
  stagesFr: string;
  outcomeAr: string;
  outcomeFr: string;
  durationLabel: string;
  sortOrder: number;
  ownerId: string;
  isCurated?: boolean;
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
  weldingCraft: weldingCraftImg,
  electricalMep: electricalMepImg,
};

export const CURATED_SKILLS: TeamSkillRecord[] = [
  {
    id: 'baseline-skill-ceramics',
    nameAr: 'تركيب البورسلان والسيراميك كبير المقاس',
    nameFr: 'Pose grès cérame & dalles grand format',
    category: 'ceramics',
    level: 'expert',
    summaryAr:
      'تبليط الأرضيات والجدران بألواح 120×120 و120×240 سم مع معالجة الميول وضبط الفواصل عند 1 ملم.',
    summaryFr:
      'Pose de dalles 120×120 et 120×240 cm avec maîtrise des pentes et joints de 1 mm.',
    toolsAr: 'ميزان الليزر الدوار، مشابك التسوية، قاطع ألواح مائي',
    sortOrder: 1,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-skill-construction',
    nameAr: 'البناء الهيكلي والخرسانة والتلبيس',
    nameFr: 'Maçonnerie structurelle & enduits',
    category: 'construction_renovation',
    level: 'expert',
    summaryAr:
      'بناء الجدران الحاملة والقواطع، صب الخرسانة، التلبيس الإسمنتي الموزون، وتهيئة الأرضيات.',
    summaryFr:
      'Élévation de murs, béton armé, enduits dressés au laser et chapes de finition.',
    toolsAr: 'شاقول ليزري، خلاط ميكانيكي، مساطر تسوية ألمنيوم',
    sortOrder: 2,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-skill-renovation',
    nameAr: 'ترميم الشقق والفيلات وإعادة التوزيع',
    nameFr: 'Rénovation intégrale & réaménagement',
    category: 'construction_renovation',
    level: 'certified',
    summaryAr:
      'هدم آمن للجدران غير الحاملة، معالجة الرطوبة والشقوق، وتحديث كامل من البنية حتى التسليم.',
    summaryFr:
      'Démolition contrôlée, traitement d’humidité et rénovation clé en main.',
    toolsAr: 'أجهزة قياس الرطوبة، مطارق هدم احترافية، عوازل إيبوكسي',
    sortOrder: 3,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-skill-welding',
    nameAr: 'اللحام والحدادة الفنية والهياكل المعدنية',
    nameFr: 'Soudure TIG/MIG & ferronnerie d’art',
    category: 'welding',
    level: 'expert',
    summaryAr:
      'تصنيع وتركيب البوابات الحديدية، الدرابزين العصري، السلالم المعدنية، وهياكل المظلات والحديد المطاوع.',
    summaryFr:
      'Fabrication de portails, garde-corps, escaliers acier et charpentes soudées.',
    toolsAr: 'آلات لحام MIG/TIG، قاطع بلازما، طلاء إيبوكسي مضاد للصدأ',
    sortOrder: 4,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-skill-electricity',
    nameAr: 'تأسيس الكهرباء المعمارية واللوحات الذكية',
    nameFr: 'Électricité architecturale & tableaux',
    category: 'electricity',
    level: 'certified',
    summaryAr:
      'تمديد الشبكات الكهربائية الثلاثية والأحادية، تركيب قواطع الحماية التفاضلية، والإضاءة المخفية.',
    summaryFr:
      'Câblage normé, tableaux différentiels, profilés LED et domotique résidentielle.',
    toolsAr: 'جهاز فحص العزل، كاشف الأسلاك، منظم توزيع الأحمال',
    sortOrder: 5,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-skill-plumbing',
    nameAr: 'السباكة متعددة الطبقات والتدفئة والعزل',
    nameFr: 'Plomberie multicouche, chauffage & étanchéité',
    category: 'plumbing',
    level: 'expert',
    summaryAr:
      'شبكات المياه الساخنة والباردة بأنابيب Multicouche، تركيب المجمّعات، الغلايات، وعزل الحمامات.',
    summaryFr:
      'Réseaux PEX/multicouche, collecteurs laiton, chaudières et étanchéité sous carrelage.',
    toolsAr: 'مكبس هيدروليكي، مضخة اختبار الضغط، أغشية عزل مائي',
    sortOrder: 6,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-skill-carpentry',
    nameAr: 'النجارة العصرية والألمنيوم والمطابخ',
    nameFr: 'Menuiserie bois, aluminium & cuisines',
    category: 'carpentry',
    level: 'advanced',
    summaryAr:
      'تفصيل المطابخ المدمجة، الأبواب الخشبية، نوافذ الألمنيوم العازلة، والخزائن المصممة حسب المقاس.',
    summaryFr:
      'Cuisines intégrées, portes intérieures, menuiserie aluminium double vitrage.',
    toolsAr: 'مناشير دقيقة بالليزر، مفصلات هيدروليكية، ألمنيوم حراري',
    sortOrder: 7,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-skill-painting',
    nameAr: 'الدهان الديكوري وأسقف الجبس المعلقة',
    nameFr: 'Peinture décorative & placoplâtre',
    category: 'painting',
    level: 'advanced',
    summaryAr:
      'تهيئة الجدران بالمعجون، تركيب ألواح BA13 المقاومة للرطوبة، والدهانات القابلة للغسل والواجهات.',
    summaryFr:
      'Enduits lissés, faux plafonds BA13 et peintures architecturales lavables.',
    toolsAr: 'ماكينة رش Airless، صنفرة مع شفط الغبار، دهانات أكريليك',
    sortOrder: 8,
    ownerId: 'curated',
    isCurated: true,
  },
];

export const CURATED_SERVICES: TeamServiceGuideRecord[] = [
  {
    id: 'baseline-service-ceramics',
    titleAr: 'تركيب السيراميك والبورسلان والرخام',
    titleFr: 'Pose de Céramique, Grès Cérame & Marbre',
    category: 'ceramics',
    natureAr:
      'أشغال تبليط وتلبيس الأرضيات والجدران الداخلية والخارجية باستخدام البورسلان كبير المقاس، السيراميك، والرخام الطبيعي.',
    natureFr:
      'Revêtement de sols et murs intérieurs/extérieurs en grès cérame grand format, faïence et marbre.',
    deliverablesAr:
      'تسوية الأرضية (Chape) وضبط الميول\nتركيب البورسلان والسيراميك بغراء C2TE المزدوج\nضبط الفواصل بمشابك التسوية الليزرية 1 ملم\nتقطيع الزوايا بزاوية 45 درجة (Onglet) وملء الفواصل بالإيبوكسي',
    deliverablesFr:
      'Ragréage et mise à niveau laser de la chape\nDouble encollage haute adhérence C2TE\nNivellement par cales et joints réguliers de 1 mm\nCoupes à 45° et jointoiement hydrofuge',
    stagesAr:
      'المعاينة ورفع المقاسات الدقيقة بالمتر الليزري\nتجهيز السطح ومعالجة العزل المائي في الحمامات\nالتخطيط المسبق لاتجاه البلاط وتقليل الفواقد\nالتركيب، التنظيف النهائي، وتسليم الأرضية جاهزة',
    stagesFr:
      'Visite technique et relevé laser des surfaces\nPréparation du support et étanchéité des pièces humides\nCalepinage optimal pour minimiser les découpes\nPose, nettoyage fin de chantier et réception',
    outcomeAr:
      'أرضيات وجدران مستوية تماماً دون فراغات تحت البلاط، مقاومة للرطوبة والماء مع تناسق هندسي للخطوط.',
    outcomeFr:
      'Surfaces parfaitement planes, sans son creux, étanches et durables avec des lignes de joints impeccables.',
    durationLabel: '5 – 14 يوماً',
    sortOrder: 1,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-service-construction',
    titleAr: 'البناء الهيكلي والترميم الشامل',
    titleFr: 'Construction & Rénovation Complète',
    category: 'construction_renovation',
    natureAr:
      'تنفيذ أشغال البناء من الأساسات والجدران إلى إعادة تأهيل وترميم المنازل والشقق القديمة بالكامل.',
    natureFr:
      'Travaux de maçonnerie, gros œuvre, réaménagement intérieur et rénovation lourde de logements.',
    deliverablesAr:
      'بناء الجدران والقواطع بالطوب أو البلوك\nأشغال الهدم الآمن وإزالة الأنقاض\nالتلبيس الإسمنتي الموزون للداخل والواجهات\nتكسية الواجهات بالحجر الطبيعي وبلاط التراسات',
    deliverablesFr:
      'Maçonnerie, cloisons et reprises structurelles\nDémolition sécurisée et évacuation des gravats\nEnduit dressé intérieur et ravalement de façade\nHabillage pierre naturelle et étanchéité terrasse',
    stagesAr:
      'دراسة حالة المبنى والمخطط الهندسي\nتأمين الموقع وتنفيذ أشغال الهدم أو البناء\nالتلبيس، العزل، وتجهيز الممرات للتقنيين\nالمراجعة النهائية وتسليم الموقع نظيفاً',
    stagesFr:
      'Diagnostic technique et planification du chantier\nSécurisation, démolition ou élévation des ouvrages\nEnduits, étanchéité et préparation des lots techniques\nContrôle final et livraison propre',
    outcomeAr:
      'هيكل متين وجدران مستقيمة خالية من التشققات والرطوبة، جاهزة لأعمال التشطيب الفاخرة.',
    outcomeFr:
      'Structure saine, murs droits et supports protégés contre l’humidité, prêts pour les finitions.',
    durationLabel: '15 – 45 يوماً',
    sortOrder: 2,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-service-welding',
    titleAr: 'اللحام والحدادة الفنية والهياكل',
    titleFr: 'Soudure, Ferronnerie & Structures Acier',
    category: 'welding',
    natureAr:
      'تفصيل، لحام، وتركيب المصنوعات الحديدية المعمارية والهياكل المعدنية الخاصة بالمنازل والفيلات والمحلات.',
    natureFr:
      'Conception, soudage et pose d’ouvrages métalliques sur mesure pour l’habitat et le bâtiment.',
    deliverablesAr:
      'تصنيع وتركيب البوابات والأبواب الحديدية الآلية\nدرابزين السلالم والشرفات بتصاميم حديثة\nالسلالم المعدنية والهياكل الداعمة والمظلات\nمعالجة الصدأ والطلاء الحراري الواقي',
    deliverablesFr:
      'Portails et portes sécurisées sur mesure\nGarde-corps d’escaliers et balcons contemporains\nEscaliers métalliques, pergolas et auvents\nTraitement anti-corrosion et peinture époxy',
    stagesAr:
      'أخذ القياسات وتحديد السمك ونوع الحديد\nالتفصيل واللحام داخل الورشة بتقنية نظيفة\nالصنفرة ومعالجة نقاط اللحام والطلاء التأسيسي\nالتركيب والتثبيت الميداني وضبط التوازن',
    stagesFr:
      'Prise de cotes et choix des profilés acier\nDécoupe et soudage TIG/MIG en atelier\nMeulage, traitement antirouille et finition\nPose sur chantier et réglage final',
    outcomeAr:
      'تجهيزات حديدية صلبة ومتناسقة مع الطراز المعماري للمنزل مع حماية طويلة الأمد ضد الصدأ.',
    outcomeFr:
      'Ouvrages robustes aux soudures propres, parfaitement ajustés et protégés contre la corrosion.',
    durationLabel: '4 – 12 يوماً',
    sortOrder: 3,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-service-electricity',
    titleAr: 'الكهرباء المعمارية والأنظمة الذكية',
    titleFr: 'Électricité Générale & Éclairage',
    category: 'electricity',
    natureAr:
      'تأسيس وتجديد الشبكات الكهربائية السكنية وتصميم أنظمة الإنارة المخفية ولوحات التوزيع المحمية.',
    natureFr:
      'Installation et mise aux normes des réseaux électriques, tableaux de protection et éclairage LED.',
    deliverablesAr:
      'توزيع الدوائر الكهربائية وفصل دوائر القوة والإنارة\nتجهيز اللوحة الكهربائية بقواطع تفاضلية\nتركيب الإضاءة المخفية وبروفايلات LED\nتأريض الشبكة وحماية الأجهزة من تقلبات التيار',
    deliverablesFr:
      'Tirage de circuits dédiés prises, force et éclairage\nTableau équipé de disjoncteurs différentiels\nÉclairage architectural et rubans LED encastrés\nMise à la terre et protection parafoudre',
    stagesAr:
      'رسم مخطط الأحمال ونقاط المآخذ والإنارة\nحفر المسارات وتمديد الأنابيب والكوابل المعزولة\nتركيب العلب وتوصيل اللوحة واختبار المقاومة\nتثبيت المفاتيح والمصابيح وتسليم المخطط',
    stagesFr:
      'Schéma des circuits et implantations\nSaignées, gainage et tirage des câbles normés\nCâblage du tableau et tests d’isolement\nPose de l’appareillage et mise sous tension',
    outcomeAr:
      'شبكة كهربائية آمنة ومنظمة تتحمل الأجهزة الثقيلة مع توزيع إنارة مريح وعملي.',
    outcomeFr:
      'Installation sécurisée, équilibrée et conforme, avec un éclairage valorisant chaque pièce.',
    durationLabel: '4 – 10 أيام',
    sortOrder: 4,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-service-plumbing',
    titleAr: 'السباكة والتدفئة المركزية والعزل',
    titleFr: 'Plomberie, Chauffage Central & Étanchéité',
    category: 'plumbing',
    natureAr:
      'تنفيذ كافة التمديدات الصحية، شبكات التدفئة المركزية، وتجهيز الحمامات والمطابخ مع اختبار الضغط.',
    natureFr:
      'Réalisation des réseaux d’eau chaude/froide, chauffage central et équipement sanitaire complet.',
    deliverablesAr:
      'تمديد أنابيب Multicouche بمجمّعات توزيع مستقلة\nتركيب الغلايات والمشعات وتدفئة الأرضيات\nتركيب المراحيض المعلقة وخلاطات الدش الدفينة\nاختبار التسرب بالضغط قبل غلق الجدران',
    deliverablesFr:
      'Distribution multicouche par nourrices indépendantes\nPose de chaudières, radiateurs et planchers chauffants\nBâti-supports suspendus et robinetterie encastrée\nMise en épreuve sous pression avant fermeture',
    stagesAr:
      'تحديد نقاط التغذية والصرف والميول المطلوبة\nتمديد الأنابيب وتثبيت المجمعات الرئيسية\nفحص الضغط لمدة 24 ساعة للتأكد من خلو التسرب\nتركيب التجهيزات الصحية النهائية والاختبار',
    stagesFr:
      'Repérage des alimentations, évacuations et pentes\nPose des canalisations et collecteurs laiton\nTest de pression 24h avant rebouchage\nInstallation des sanitaires et mise en service',
    outcomeAr:
      'تدفق مياه متوازن وخالٍ من التسربات مع سهولة الصيانة عبر مجمعات التوزيع المستقلة.',
    outcomeFr:
      'Réseau fiable sans fuite, pression constante et maintenance facilitée par nourrices.',
    durationLabel: '4 – 10 أيام',
    sortOrder: 5,
    ownerId: 'curated',
    isCurated: true,
  },
];

export const CURATED_TEAM_MEMBERS: ArtisanRecord[] = [
  {
    id: 'baseline-team-nassim',
    displayName: 'نسيم ع. · ورشة السيراميك والبناء',
    roleTitle: 'مشرف الفريق ومختص البورسلان والترميم',
    profession: 'ceramics',
    experienceYears: 12,
    wilaya: 'الجزائر العاصمة',
    commune: 'حيدرة',
    bio: 'خبرة ميدانية في الإشراف على مشاريع البناء والترميم الشامل وتركيب ألواح البورسلان كبيرة المقاس والرخام بدقة ليزرية.',
    skillsList: [
      'بورسلان 120×240',
      'التسوية بالليزر',
      'الترميم الشامل',
      'عزل الحمامات',
    ],
    avatarUrl: GENERATED_ASSETS.ceramicArtisan,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-team-welding',
    displayName: 'كريم ب. · ورشة اللحام والحدادة',
    roleTitle: 'حرفي لحام وهياكل معدنية',
    profession: 'welding',
    experienceYears: 10,
    wilaya: 'البليدة',
    commune: 'بوفاريك',
    bio: 'متخصص في تصنيع البوابات الحديدية، السلالم المعدنية، الدرابزين المعماري، والهياكل الملحومة بتقنية TIG وMIG.',
    skillsList: [
      'لحام TIG/MIG',
      'بوابات وأسوار',
      'سلالم معدنية',
      'طلاء ضد الصدأ',
    ],
    avatarUrl: GENERATED_ASSETS.weldingCraft,
    ownerId: 'curated',
    isCurated: true,
  },
  {
    id: 'baseline-team-mep',
    displayName: 'يوسف م. · وحدة الكهرباء والسباكة',
    roleTitle: 'تقني التأسيس الكهربائي والسباكة',
    profession: 'electricity',
    experienceYears: 9,
    wilaya: 'الجزائر العاصمة',
    commune: 'دالي إبراهيم',
    bio: 'إنجاز اللوحات الكهربائية المحمية، الإنارة المخفية LED، وتمديدات السباكة متعددة الطبقات والتدفئة المركزية.',
    skillsList: [
      'لوحات كهربائية',
      'إنارة LED',
      'سباكة Multicouche',
      'تدفئة مركزية',
    ],
    avatarUrl: GENERATED_ASSETS.electricalMep,
    ownerId: 'curated',
    isCurated: true,
  },
];

export const CURATED_PROJECTS: ProjectRecord[] = [
  {
    id: 'curated-oran-apartment',
    title: 'نموذج مرجعي: ترميم وتأهيل شقة من الطوب الأحمر إلى التسليم',
    category: 'construction_renovation',
    location: 'بئر الجير، وهران',
    areaSqm: '140 م²',
    description:
      'تجديد متكامل لشقة سكنية انطلاقاً من مرحلة الأشغال الكبرى والطوب الأحمر وصولاً إلى التلبيس، التمديدات الصحية والكهربائية، وتركيب البورسلان.',
    coverImage: GENERATED_ASSETS.afterFinished,
    beforeImage: GENERATED_ASSETS.beforeConstruction,
    completedServices: [
      'بناء وتعديل القواطع',
      'التلبيس والجبس',
      'الكهرباء والسباكة',
      'تبليط البورسلان',
    ],
    artisanId: 'baseline-team-nassim',
    ownerId: 'curated',
    ownerName: 'فريق اخدم دارك',
    isCurated: true,
    extraPhotos: [
      {
        imageUrl: GENERATED_ASSETS.beforeConstruction,
        caption: 'حالة الشقة قبل بدء أشغال الترميم والتبليط',
      },
    ],
  },
  {
    id: 'curated-hydra-villa',
    title: 'نموذج مرجعي: تبليط وتجديد صالون فيلا بالبورسلان الترافرتين',
    category: 'ceramics',
    location: 'حيدرة، الجزائر العاصمة',
    areaSqm: '210 م²',
    description:
      'تجديد طابق أرضي بفيلا سكنية مع تركيب ألواح بورسلان مقاس 120×120 سم بتشطيب ترافرتين طبيعي، وإعادة تهيئة الأسقف الجبسية مع الإضاءة المخفية.',
    coverImage: GENERATED_ASSETS.heroVilla,
    beforeImage: GENERATED_ASSETS.beforeConstruction,
    completedServices: [
      'تسوية الأرضية بالليزر',
      'تركيب بورسلان 120×120',
      'أسقف جبسية وإضاءة مخفية',
    ],
    artisanId: 'baseline-team-nassim',
    ownerId: 'curated',
    ownerName: 'فريق اخدم دارك',
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
    id: 'curated-welding-staircase',
    title: 'نموذج مرجعي: تفصيل ولحام سلم معدني وبوابة خارجية عصرية',
    category: 'welding',
    location: 'بوفاريك، البليدة',
    areaSqm: '45 م²',
    description:
      'تصنيع ولحام هيكل سلم معدني بسمك مقوى مع بوابة حديدية مصممة بالليزر ومعالجة كاملة بمضادات الصدأ والطلاء الأسود غير اللامع.',
    coverImage: GENERATED_ASSETS.weldingCraft,
    completedServices: [
      'تفصيل هيكل سلم فولاذي',
      'بوابة حديدية آمنة',
      'معالجة وطلاء إيبوكسي',
    ],
    artisanId: 'baseline-team-welding',
    ownerId: 'curated',
    ownerName: 'فريق اخدم دارك',
    isCurated: true,
  },
  {
    id: 'curated-mep-panel',
    title: 'نموذج مرجعي: تأسيس لوحة كهرباء وتوزيع سباكة Multicouche',
    category: 'electricity',
    location: 'دالي إبراهيم، الجزائر العاصمة',
    areaSqm: '165 م²',
    description:
      'تركيب لوحة كهربائية تفاضلية متعددة الدوائر مع إضاءة سقفية غاطسة وتأسيس شبكة توزيع مياه وتدفئة مركزية بمجمّعات نحاسية.',
    coverImage: GENERATED_ASSETS.electricalMep,
    beforeImage: GENERATED_ASSETS.beforeConstruction,
    completedServices: [
      'لوحة توزيع كهربائية محمية',
      'تمديد إضاءة LED سقفية',
      'مجمع سباكة Multicouche',
    ],
    artisanId: 'baseline-team-mep',
    ownerId: 'curated',
    ownerName: 'فريق اخدم دارك',
    isCurated: true,
  },
  {
    id: 'curated-kitchen-calacatta',
    title: 'نموذج مرجعي: تصميم وتبليط مطبخ عصري بألواح الكالاكاتا',
    category: 'ceramics',
    location: 'دالي إبراهيم، الجزائر العاصمة',
    areaSqm: '38 م²',
    description:
      'تركيب ألواح سيراميك وبورسلان كالاكاتا الكبيرة للجدران وجزيرة المطبخ الوسطية مع تناسق العروق الرخامية وأرضيات مصقولة.',
    coverImage: GENERATED_ASSETS.kitchenMarble,
    beforeImage: GENERATED_ASSETS.beforeConstruction,
    completedServices: [
      'ألواح كالاكاتا للجدران',
      'سباكة المطبخ والعزل',
      'إضاءة عمل مدمجة',
    ],
    artisanId: 'baseline-team-nassim',
    ownerId: 'curated',
    ownerName: 'فريق اخدم دارك',
    isCurated: true,
  },
  {
    id: 'curated-facade-bejaia',
    title: 'نموذج مرجعي: بناء وتكسية واجهة فيلا ساحلية بالحجر الطبيعي',
    category: 'construction_renovation',
    location: 'بجاية',
    areaSqm: '340 م²',
    description:
      'أشغال البناء والتشطيب الخارجي شاملة تكسية الأعمدة بالحجر الطبيعي المقاوم للرطوبة وتبليط التراس ببلاط خارجي مانع للانزلاق.',
    coverImage: GENERATED_ASSETS.exteriorFacade,
    completedServices: [
      'تكسية واجهة بالحجر الطبيعي',
      'عزل الرطوبة الخارجي',
      'تبليط التراس الخارجي',
    ],
    artisanId: 'baseline-team-nassim',
    ownerId: 'curated',
    ownerName: 'فريق اخدم دارك',
    isCurated: true,
  },
];
