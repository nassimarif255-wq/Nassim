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
  specialties?: string[];
  artisanId?: string;
  ownerId: string;
  ownerName: string;
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
  toolsList?: string[];
  avatarUrl: string;
  ownerId: string;
}

export type SkillLevelId = 'expert' | 'advanced' | 'certified';

export interface TeamSkillRecord {
  id: string;
  nameAr: string;
  nameFr: string;
  category: ServiceCategoryId;
  level: SkillLevelId;
  experienceLabel?: string;
  summaryAr: string;
  summaryFr: string;
  toolsAr: string;
  toolsFr?: string;
  tasksAr?: string;
  tasksFr?: string;
  artisanId?: string;
  sortOrder: number;
  ownerId: string;
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
  materialsToolsAr?: string;
  materialsToolsFr?: string;
  qualityStandardsAr?: string;
  qualityStandardsFr?: string;
  outcomeAr: string;
  outcomeFr: string;
  durationLabel: string;
  sortOrder: number;
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
  adminNote?: string;
  ownerId: string;
  ownerName: string;
}

export interface InquiryRecord {
  id: string;
  senderId: string;
  senderName: string;
  recipientOwnerId: string;
  recipientName: string;
  contextType: 'team' | 'artisan' | 'request';
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

// Official technical capability templates (editable/importable via Admin into Firestore; contain zero fake member names or fake projects)
export const CURATED_SKILLS: TeamSkillRecord[] = [
  {
    id: 'template-skill-ceramics',
    nameAr: 'تركيب البورسلان والسيراميك كبير المقاس',
    nameFr: 'Pose grès cérame & dalles grand format',
    category: 'ceramics',
    level: 'expert',
    experienceLabel: 'تشطيب عالي الدقة',
    summaryAr:
      'تبليط الأرضيات والجدران بالبورسلان والسيراميك والرخام مع ضبط الاستواء والميول ومعالجة الفواصل.',
    summaryFr:
      'Pose de grès cérame, faïence et marbre avec contrôle de planéité, gestion des pentes et joints précis.',
    toolsAr: 'ميزان ليزري، مشابك تسوية، قاطع ألواح مائي، مسننة غراء مزدوج',
    toolsFr: 'Niveau laser, cales autonivelantes, coupe-carreaux à eau',
    tasksAr:
      'تسوية الأرضيات وتجهيز السطح\nتثبيت ألواح البورسلان 120×120 و60×120\nتقطيع الزوايا بزاوية 45 درجة (Onglet)\nملء الفواصل بالإيبوكسي المقاوم للماء',
    tasksFr:
      'Ragréage et préparation des supports\nPose de dalles grand format 120×120 et 60×120\nCoupes d’onglet à 45°\nJointoiement hydrofuge et époxy',
    artisanId: '',
    sortOrder: 1,
    ownerId: 'template',
  },
  {
    id: 'template-skill-construction',
    nameAr: 'البناء الهيكلي والخرسانة والتلبيس',
    nameFr: 'Maçonnerie structurelle & enduits',
    category: 'construction_renovation',
    level: 'expert',
    experienceLabel: 'أشغال كبرى وميدانية',
    summaryAr:
      'بناء الجدران والقواطع، الأشغال الخرسانية، التلبيس الإسمنتي الموزون، وتهيئة الواجهات والتراسات.',
    summaryFr:
      'Élévation de murs et cloisons, ouvrages béton, enduits dressés et préparation des terrasses.',
    toolsAr: 'شاقول ليزري، خلاط ميكانيكي، مساطر تسوية ألمنيوم، معدات تدعيم',
    toolsFr: 'Fil à plomb laser, bétonnière, règles alu dressées',
    tasksAr:
      'بناء الجدران بالطوب والبلوك والآجر\nالتلبيس الداخلي والخارجي الموزون\nصب الأرضيات الخرسانية وضبط الميول\nتكسية الواجهات بالحجر الطبيعي',
    tasksFr:
      'Maçonnerie en brique et parpaing\nEnduits intérieurs et façades dressés\nChapes béton et formes de pente\nHabillage pierre naturelle',
    artisanId: '',
    sortOrder: 2,
    ownerId: 'template',
  },
  {
    id: 'template-skill-renovation',
    nameAr: 'الترميم الشامل وإعادة التهيئة الداخلية',
    nameFr: 'Rénovation intégrale & réaménagement',
    category: 'construction_renovation',
    level: 'certified',
    experienceLabel: 'ترميم وتحديث',
    summaryAr:
      'هدم آمن للقواطع غير الحاملة، معالجة الرطوبة والشقوق، وإعادة توزيع المساحات وفق متطلبات المبنى.',
    summaryFr:
      'Démolition contrôlée de cloisons, traitement d’humidité et réorganisation complète des espaces.',
    toolsAr: 'كاشف رطوبة، مطارق هدم احترافية، مواد معالجة وعزل إيبوكسي',
    toolsFr: 'Testeur d’humidité, perforateurs-burineurs, résines d’étanchéité',
    tasksAr:
      'فحص الجدران ومعالجة التسربات والرطوبة\nإعادة تقسيم الغرف والمطابخ\nإزالة البلاط والملبسات القديمة\nتجهيز الموقع لأشغال التشطيب',
    tasksFr:
      'Diagnostic et traitement de l’humidité\nReconfiguration des pièces et cuisines\nDépose contrôlée des anciens revêtements\nPréparation complète avant finitions',
    artisanId: '',
    sortOrder: 3,
    ownerId: 'template',
  },
  {
    id: 'template-skill-welding',
    nameAr: 'اللحام والحدادة الفنية والهياكل المعدنية',
    nameFr: 'Soudure TIG/MIG & ferronnerie d’art',
    category: 'welding',
    level: 'expert',
    experienceLabel: 'ورشة وميدان',
    summaryAr:
      'تصنيع ولحام وتركيب البوابات الحديدية، الدرابزين، السلالم المعدنية، والمظلات والهياكل الحديدية.',
    summaryFr:
      'Fabrication, soudage et pose de portails, garde-corps, escaliers métalliques et pergolas.',
    toolsAr: 'ماكينات لحام MIG/TIG وArc، قاطع بلازما، صاروخ جلي، طلاء مضاد للصدأ',
    toolsFr: 'Postes à souder MIG/TIG/Arc, découpeur plasma, peinture époxy',
    tasksAr:
      'تفصيل البوابات والأبواب الحديدية\nصناعة درابزين السلالم والشرفات\nتصميم ولحام السلالم والهياكل الداعمة\nمعالجة الصدأ والطلاء الواقي',
    tasksFr:
      'Portails et portes métalliques sur mesure\nGarde-corps d’escaliers et balcons\nEscaliers acier et structures porteuses\nTraitement anti-corrosion et finition',
    artisanId: '',
    sortOrder: 4,
    ownerId: 'template',
  },
  {
    id: 'template-skill-electricity',
    nameAr: 'التأسيس الكهربائي واللوحات المحمية',
    nameFr: 'Électricité générale & tableaux',
    category: 'electricity',
    level: 'certified',
    experienceLabel: 'معايير سلامة',
    summaryAr:
      'تأسيس وتجديد الشبكات الكهربائية السكنية، فصل الدوائر، تجهيز اللوحات التفاضلية، والإضاءة المعمارية.',
    summaryFr:
      'Câblage résidentiel normé, séparation des circuits, tableaux différentiels et éclairage LED.',
    toolsAr: 'جهاز قياس العزل والممانعة، كاشف أسلاك، أدوات كبس وتوزيع',
    toolsFr: 'Testeur d’isolement, détecteur de câbles, outillage isolé 1000V',
    tasksAr:
      'تمديد الكوابل وفصل خطوط القوة والإنارة\nتركيب لوحات القواطع والحماية التفاضلية\nتجهيز الإضاءة المخفية وبروفايلات LED\nتأريض الشبكة وفحص السلامة',
    tasksFr:
      'Tirage de circuits prises, force et éclairage\nPose de tableaux différentiels\nÉclairage encastré et rubans LED\nMise à la terre et tests de conformité',
    artisanId: '',
    sortOrder: 5,
    ownerId: 'template',
  },
  {
    id: 'template-skill-plumbing',
    nameAr: 'السباكة متعددة الطبقات والتدفئة والعزل',
    nameFr: 'Plomberie multicouche, chauffage & étanchéité',
    category: 'plumbing',
    level: 'expert',
    experienceLabel: 'اختبار ضغط',
    summaryAr:
      'تمديدات المياه الساخنة والباردة بأنابيب Multicouche، التدفئة المركزية، والعزل المائي للحمامات.',
    summaryFr:
      'Réseaux PEX/multicouche sur collecteurs, chauffage central et étanchéité des pièces humides.',
    toolsAr: 'مكبس هيدروليكي، مضخة اختبار الضغط، لحام PPR، أغشية عزل مائي',
    toolsFr: 'Pince à sertir électro-hydraulique, pompe d’épreuve, kit étanchéité',
    tasksAr:
      'تركيب مجمّعات التوزيع المستقلة\nتمديد شبكات التدفئة والغلايات\nتجهيز الحمامات والخلاطات الدفينة\nاختبار الضغط ومنع التسربات',
    tasksFr:
      'Pose de collecteurs et nourrices\nChauffage central et chaudières\nÉquipement sanitaire et encastrés\nÉpreuve sous pression avant fermeture',
    artisanId: '',
    sortOrder: 6,
    ownerId: 'template',
  },
  {
    id: 'template-skill-carpentry',
    nameAr: 'النجارة العصرية والألمنيوم والمطابخ',
    nameFr: 'Menuiserie bois, aluminium & cuisines',
    category: 'carpentry',
    level: 'advanced',
    experienceLabel: 'تفصيل حسب الطلب',
    summaryAr:
      'تفصيل وتركيب المطابخ المدمجة، الأبواب الداخلية، الخزائن، ونوافذ الألمنيوم العازلة.',
    summaryFr:
      'Fabrication et pose de cuisines intégrées, portes, dressings et menuiserie aluminium.',
    toolsAr: 'مناشير توجيه دقيقة، مثقاب تجميع، ألمنيوم حراري ومفصلات هيدروليكية',
    toolsFr: 'Scie plongeante sur rail, gabarits d’assemblage, quincaillerie soft-close',
    tasksAr:
      'تفصيل خزائن المطبخ والواجهات\nتركيب الأبواب الخشبية والأطر\nنوافذ وأبواب الألمنيوم مزدوجة الزجاج\nضبط المفصلات والأدراج الهيدروليكية',
    tasksFr:
      'Cuisines intégrées sur mesure\nPortes intérieures et placards\nMenuiserie aluminium double vitrage\nRéglage quincaillerie hydraulique',
    artisanId: '',
    sortOrder: 7,
    ownerId: 'template',
  },
  {
    id: 'template-skill-painting',
    nameAr: 'الدهان الديكوري وأسقف الجبس BA13',
    nameFr: 'Peinture décorative & placoplâtre BA13',
    category: 'painting',
    level: 'advanced',
    experienceLabel: 'تشطيب نهائي',
    summaryAr:
      'تهيئة الجدران بالمعجون، تركيب أسقف وقواطع الجبس المقاومة للرطوبة، والطلاء الداخلي والخارجي.',
    summaryFr:
      'Préparation des supports, plafonds et cloisons BA13 hydrofuges, peintures architecturales.',
    toolsAr: 'ماكينة رش Airless، صنفرة مع شفط الغبار، مساطر جبس وليزر',
    toolsFr: 'Station de peinture Airless, ponceuse girafe aspirante, laser ligne',
    tasksAr:
      'تركيب أسقف BA13 ومسارات الإنارة\nصنفرة ومعالجة الشقوق بالمعجون\nالدهان القابل للغسل والدهانات الديكورية\nطلاء الواجهات المقاوم للعوامل الجوية',
    tasksFr:
      'Faux plafonds BA13 et corniches LED\nEnduisage fin et ponçage sans poussière\nPeintures lavables et effets décoratifs\nRevêtement et protection de façades',
    artisanId: '',
    sortOrder: 8,
    ownerId: 'template',
  },
];

export const CURATED_SERVICES: TeamServiceGuideRecord[] = [
  {
    id: 'template-service-ceramics',
    titleAr: 'تركيب السيراميك والبورسلان والرخام',
    titleFr: 'Pose de Céramique, Grès Cérame & Marbre',
    category: 'ceramics',
    natureAr:
      'أشغال تبليط وتلبيس الأرضيات والجدران الداخلية والخارجية بالبورسلان والسيراميك والرخام مع ضبط الاستواء والميول.',
    natureFr:
      'Revêtement complet de sols et murs intérieurs/extérieurs en grès cérame, faïence et pierre naturelle.',
    deliverablesAr:
      'تسوية الأرضية (Chape) وضبط الميول\nتركيب البورسلان والسيراميك باللصق المزدوج\nضبط الفواصل بمشابك التسوية الليزرية\nتقطيع الزوايا بزاوية 45 درجة وملء الفواصل',
    deliverablesFr:
      'Ragréage et mise à niveau laser de la chape\nDouble encollage haute adhérence\nNivellement par cales et joints réguliers\nCoupes d’onglet à 45° et jointoiement étanche',
    stagesAr:
      'المعاينة ورفع المقاسات الدقيقة بالمتر الليزري\nتجهيز السطح ومعالجة العزل المائي في المناطق الرطبة\nتخطيط توزيع البلاط لتقليل الهدر وتوحيد الخطوط\nالتركيب، التنظيف النهائي، والفحص الشامل',
    stagesFr:
      'Visite technique et relevé laser\nPréparation des supports et étanchéité\nCalepinage optimal des dalles\nPose, nettoyage et contrôle de planéité',
    materialsToolsAr:
      'غراء مرن عالي الالتصاق C2TE، فواصل تسوية ليزرية، روبة مقاومة للرطوبة والإيبوكسي، قواطع ماسية مبردة بالماء.',
    materialsToolsFr:
      'Mortier-colle flexible C2TE, croisillons autonivelants, joints hydrofuges/époxy, disques diamant à eau.',
    qualityStandardsAr:
      'فحص الخلو من الفراغات تحت البلاط، مطابقة استواء السطح بميزان الليزر، واختبار تصريف المياه في الحمامات والتراسات.',
    qualityStandardsFr:
      'Contrôle de plein bain de colle sans vide, vérification au laser et test d’écoulement des pentes.',
    outcomeAr:
      'أرضيات وجدران مستوية تماماً ومقاومة للرطوبة والاستخدام اليومي مع تناسق هندسي للخطوط.',
    outcomeFr:
      'Surfaces planes, étanches et durables avec des lignes de joints homogènes.',
    durationLabel: 'تُحدد بعد المعاينة حسب المساحة',
    sortOrder: 1,
    ownerId: 'template',
  },
  {
    id: 'template-service-construction',
    titleAr: 'البناء الهيكلي والترميم الشامل',
    titleFr: 'Construction & Rénovation Complète',
    category: 'construction_renovation',
    natureAr:
      'تنفيذ أشغال البناء الهيكلي، القواطع، التلبيس، وإعادة تأهيل المنازل والشقق من الحالة الخام حتى التجهيز للتشطيب.',
    natureFr:
      'Travaux de maçonnerie, gros œuvre, réaménagement intérieur et réhabilitation complète de logements.',
    deliverablesAr:
      'بناء الجدران والقواطع بالطوب أو البلوك\nأشغال الهدم الآمن وإخلاء الأنقاض\nالتلبيس الإسمنتي الموزون للداخل والواجهات\nتكسية الواجهات بالحجر الطبيعي وعزل التراسات',
    deliverablesFr:
      'Maçonnerie, cloisons et reprises\nDémolition contrôlée et évacuation\nEnduits dressés intérieurs et extérieurs\nHabillage pierre et étanchéité terrasses',
    stagesAr:
      'دراسة حالة المبنى والمخطط الهندسي أو الميداني\nتأمين الموقع وتنفيذ أشغال الهدم أو البناء\nالتلبيس، العزل، وتهيئة المسارات للكهرباء والسباكة\nالمراجعة الهندسية وتسليم الموقع جاهزاً للتشطيب',
    stagesFr:
      'Diagnostic technique et planification\nSécurisation et gros œuvre / démolition\nEnduits, étanchéité et réservations techniques\nContrôle final avant lots de finition',
    materialsToolsAr:
      'إسمنت وملاط مطابق للمواصفات، حديد تسليح، شبك تقوية الزوايا، مواد عزل بيتومينية وإيبوكسية، وأدوات قياس ليزرية.',
    materialsToolsFr:
      'Ciment et mortiers dosés, armatures, treillis anti-fissures, membranes d’étanchéité et niveaux laser.',
    qualityStandardsAr:
      'التحقق من شاقولية الجدران، تقوية مناطق التقاء الطوب بالخرسانة لمنع التشققات، ومعالجة الرطوبة قبل التلبيس.',
    qualityStandardsFr:
      'Contrôle d’aplomb des parois, pontage des jonctions béton/brique et traitement préalable de l’humidité.',
    outcomeAr:
      'هيكل متين وجدران مستقيمة خالية من التشققات والرطوبة وجاهزة لباقي مراحل التشطيب.',
    outcomeFr:
      'Structure saine, murs d’aplomb et supports protégés contre l’humidité.',
    durationLabel: 'تُحدد حسب حجم الورشة والمخطط',
    sortOrder: 2,
    ownerId: 'template',
  },
  {
    id: 'template-service-welding',
    titleAr: 'اللحام والحدادة الفنية والهياكل',
    titleFr: 'Soudure, Ferronnerie & Structures Acier',
    category: 'welding',
    natureAr:
      'تصميم، تفصيل، لحام وتركيب المصنوعات الحديدية المعمارية والهياكل المعدنية للمنازل والفيلات والمحلات.',
    natureFr:
      'Conception, soudage et pose d’ouvrages métalliques sur mesure pour l’habitat et le bâtiment.',
    deliverablesAr:
      'تصنيع وتركيب البوابات والأبواب الحديدية\nدرابزين السلالم والشرفات بتصاميم عصرية\nالسلالم المعدنية والهياكل الداعمة والمظلات\nمعالجة الصدأ والطلاء الواقي',
    deliverablesFr:
      'Portails et portes métalliques sécurisées\nGarde-corps d’escaliers et balcons\nEscaliers acier, pergolas et auvents\nTraitement antirouille et peinture de finition',
    stagesAr:
      'أخذ القياسات وتحديد سمك ونوع المقاطع الحديدية\nالقص واللحام داخل الورشة بدقة\nالصنفرة وتنظيف نقاط اللحام والطلاء التأسيسي\nالتركيب والتثبيت الميداني وضبط التوازن والغلق',
    stagesFr:
      'Prise de cotes et choix des profilés\nDécoupe et soudage TIG/MIG en atelier\nMeulage, dégraissage et couche antirouille\nPose sur site, scellement et réglages',
    materialsToolsAr:
      'مقاطع حديد مجلفن أو أسود بسماكات مدروسة، أسلاك لحام TIG/MIG، دهانات أساس ضد الصدأ، ومثبتات فولاذية ثقيلة.',
    materialsToolsFr:
      'Profilés acier dimensionnés, consommables TIG/MIG, primaire anti-corrosion, ancrages mécaniques.',
    qualityStandardsAr:
      'لحام مستمر ومتجانس، جلي نظيف للحواف الحادة، حماية ضد الصدأ قبل الطلاء النهائي، واختبار الثبات والحمولة.',
    qualityStandardsFr:
      'Soudures continues et meulées, protection anti-corrosion complète et test de rigidité après ancrage.',
    outcomeAr:
      'تجهيزات حديدية صلبة وآمنة متناسقة مع الطراز المعماري مع حماية طويلة الأمد من الصدأ.',
    outcomeFr:
      'Ouvrages métalliques solides, soignés et protégés durablement contre la corrosion.',
    durationLabel: 'تُحدد حسب التفصيل والمقاسات',
    sortOrder: 3,
    ownerId: 'template',
  },
  {
    id: 'template-service-electricity',
    titleAr: 'الكهرباء المعمارية والأنظمة المحمية',
    titleFr: 'Électricité Générale & Éclairage',
    category: 'electricity',
    natureAr:
      'تأسيس وتجديد الشبكات الكهربائية السكنية وتصميم أنظمة الإنارة المخفية ولوحات التوزيع المحمية.',
    natureFr:
      'Installation et mise en sécurité des réseaux électriques, tableaux différentiels et éclairage LED.',
    deliverablesAr:
      'توزيع الدوائر وفصل خطوط القوة والإنارة والأجهزة الثقيلة\nتجهيز اللوحة الكهربائية بقواطع تفاضلية\nتركيب الإضاءة المخفية وبروفايلات LED\nتأريض الشبكة وحماية الأجهزة',
    deliverablesFr:
      'Séparation des circuits prises, éclairage et gros électroménager\nTableau équipé de protections différentielles\nÉclairage architectural et rubans LED\nMise à la terre et protection',
    stagesAr:
      'رسم مخطط الأحمال ونقاط المآخذ والإنارة\nحفر المسارات وتمديد الأنابيب والكوابل المعزولة\nتجميع اللوحة الكهربائية واختبار العزل والأحمال\nتثبيت المفاتيح والمصابيح وتسليم المخطط',
    stagesFr:
      'Planification des charges et implantations\nSaignées, gainage et câblage normé\nCâblage du tableau et tests d’isolement\nPose de l’appareillage et mise sous tension',
    materialsToolsAr:
      'كوابل نحاسية معزولة بمقاطع مناسبة للأحمال، أنابيب حماية، قواطع تفاضلية معتمدة، وأجهزة قياس العزل.',
    materialsToolsFr:
      'Câbles cuivre normés, gaines ICTA, disjoncteurs différentiels et testeur d’isolement.',
    qualityStandardsAr:
      'اختبار العزل الكهربائي قبل التغطية، وسم جميع القواطع بوضوح داخل اللوحة، وضمان عمل الحماية التفاضلية والتأريض.',
    qualityStandardsFr:
      'Mesure d’isolement avant rebouchage, repérage complet du tableau et test de déclenchement différentiel.',
    outcomeAr:
      'شبكة كهربائية آمنة ومنظمة تتحمل الأجهزة المنزلية مع إنارة عملية ومريحة.',
    outcomeFr:
      'Installation électrique fiable, sécurisée et claire à exploiter au quotidien.',
    durationLabel: 'تُحدد حسب عدد النقاط والمساحة',
    sortOrder: 4,
    ownerId: 'template',
  },
  {
    id: 'template-service-plumbing',
    titleAr: 'السباكة والتدفئة المركزية والعزل',
    titleFr: 'Plomberie, Chauffage Central & Étanchéité',
    category: 'plumbing',
    natureAr:
      'تنفيذ التمديدات الصحية، شبكات التدفئة المركزية، وتجهيز الحمامات والمطابخ مع اختبار الضغط الكامل.',
    natureFr:
      'Réseaux sanitaires eau chaude/froide, chauffage central et équipement complet avec épreuve pression.',
    deliverablesAr:
      'تمديد أنابيب Multicouche بمجمّعات توزيع مستقلة\nتركيب الغلايات والمشعات وتدفئة الأرضيات\nتركيب المراحيض المعلقة وخلاطات الدش الدفينة\nالعزل المائي واختبار الضغط قبل الغلق',
    deliverablesFr:
      'Distribution multicouche par nourrices indépendantes\nChaudières, radiateurs et planchers chauffants\nBâti-supports suspendus et robinetterie encastrée\nÉtanchéité et mise en épreuve sous pression',
    stagesAr:
      'تحديد نقاط التغذية والصرف والميول المطلوبة\nتمديد الأنابيب وتثبيت المجمعات الرئيسية\nفحص الضغط للتأكد من خلو التسرب قبل غلق الجدران\nتركيب التجهيزات الصحية النهائية والاختبار التشغيلي',
    stagesFr:
      'Repérage des arrivées, évacuations et pentes\nPose des réseaux et collecteurs laiton\nÉpreuve pression avant rebouchage\nPose des sanitaires et mise en eau',
    materialsToolsAr:
      'أنابيب Multicouche أو PPR معتمدة، مجمّعات نحاسية بصمامات عزل، أغشية عزل مائي، ومكبس ومضخة ضغط.',
    materialsToolsFr:
      'Tubes multicouche certifiés, collecteurs laiton, membranes d’étanchéité, pompe d’épreuve.',
    qualityStandardsAr:
      'إلزامية اختبار الشبكة تحت الضغط قبل أي تلبيس، التحقق من ميول الصرف الصحي، ومنع تقاطعات التمديدات غير الآمنة.',
    qualityStandardsFr:
      'Mise en pression obligatoire avant fermeture des parois et contrôle des pentes d’évacuation.',
    outcomeAr:
      'تدفق مياه متوازن وخالٍ من التسربات مع سهولة الصيانة عبر مجمعات التوزيع المستقلة.',
    outcomeFr:
      'Réseau fiable, sans fuite, avec coupure et maintenance faciles par circuit.',
    durationLabel: 'تُحدد حسب حجم التمديدات',
    sortOrder: 5,
    ownerId: 'template',
  },
];

export const CURATED_TEAM_MEMBERS: ArtisanRecord[] = [];
export const CURATED_PROJECTS: ProjectRecord[] = [];
