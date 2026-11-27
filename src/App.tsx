import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import {
  ArrowUpLeft,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Flame,
  Grid2x2,
  Hammer,
  MessageSquare,
  Moon,
  MoveHorizontal,
  PaintRoller,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { initHeroCanvas } from './webgl/heroCanvas';
import { initSpecsCanvas } from './webgl/specsCanvas';
import {
  ArtisanRecord,
  CURATED_PROJECTS,
  CURATED_SERVICES,
  CURATED_SKILLS,
  CURATED_TEAM_MEMBERS,
  GENERATED_ASSETS,
  ProjectCategory,
  ProjectRecord,
  ServiceRequestRecord,
  SkillLevelId,
  TeamServiceGuideRecord,
  TeamSkillRecord,
} from './data/showcaseDefaults';
import {
  AppLang,
  getCategoryLabel,
  SERVICE_CATEGORIES,
  ServiceCategoryId,
  UI_COPY,
} from './data/i18n';
import { ALGERIA_WILAYAS } from './data/algeriaLocations';
import { ProjectLightbox } from './components/ProjectLightbox';
import {
  PortalTab,
  ProjectManagerDrawer,
} from './components/ProjectManagerDrawer';
import { ArtisanProfileModal } from './components/ArtisanProfileModal';
import { RequestDetailModal } from './components/RequestDetailModal';
import { ContactModal, ContactTarget } from './components/ContactModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { RevealBlock, SpotlightCard } from './components/ui/motion-primitives';

gsap.registerPlugin(ScrollTrigger);

const ADMIN_EMAIL = 'nassimarif255@gmail.com';

const CATEGORY_ICONS: Record<ServiceCategoryId, typeof Hammer> = {
  construction_renovation: Hammer,
  ceramics: Grid2x2,
  welding: Flame,
  electricity: Zap,
  plumbing: Droplets,
  carpentry: Wrench,
  painting: PaintRoller,
  hvac: Wind,
  solar: Sun,
};

function readCachedList<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeCachedList<T>(key: string, items: T[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

function getSkillLevelLabel(level: SkillLevelId, lang: AppLang): string {
  if (level === 'expert') {
    return lang === 'ar' ? 'تخصص رئيسي' : 'Expertise métier';
  }
  if (level === 'certified') {
    return lang === 'ar' ? 'معايير هندسية' : 'Normé & certifié';
  }
  return lang === 'ar' ? 'مستوى متقدم' : 'Maîtrise avancée';
}

function matchesCategoryFilter(
  itemCategory: string,
  filter: ServiceCategoryId | 'all'
): boolean {
  if (filter === 'all') return true;
  if (itemCategory === filter) return true;
  if (
    filter === 'construction_renovation' &&
    ['construction', 'renovation', 'facades'].includes(itemCategory)
  ) {
    return true;
  }
  if (filter === 'ceramics' && itemCategory === 'kitchen_bath') {
    return true;
  }
  return false;
}

export default function App() {
  const [lang, setLang] = useState<AppLang>('ar');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [heroSpotIdx, setHeroSpotIdx] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [captionBlur, setCaptionBlur] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [splitAnimate, setSplitAnimate] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // Unified Search Filters (Profession + Wilaya + Commune + Keyword)
  const [filterProfession, setFilterProfession] = useState<
    ServiceCategoryId | 'all'
  >('all');
  const [filterWilaya, setFilterWilaya] = useState<string>('all');
  const [filterCommune, setFilterCommune] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Firestore Public Collections (with offline localStorage cache fallback)
  const [firestoreProjects, setFirestoreProjects] = useState<ProjectRecord[]>(
    () => readCachedList<ProjectRecord>('dzdarkom_cache_projects')
  );
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [artisans, setArtisans] = useState<ArtisanRecord[]>(() =>
    readCachedList<ArtisanRecord>('dzdarkom_cache_artisans')
  );
  const [artisansLoading, setArtisansLoading] = useState(true);

  const [requests, setRequests] = useState<ServiceRequestRecord[]>(() =>
    readCachedList<ServiceRequestRecord>('dzdarkom_cache_requests')
  );
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [firestoreSkills, setFirestoreSkills] = useState<TeamSkillRecord[]>(
    () => readCachedList<TeamSkillRecord>('dzdarkom_cache_skills')
  );
  const [firestoreServices, setFirestoreServices] = useState<
    TeamServiceGuideRecord[]
  >(() => readCachedList<TeamServiceGuideRecord>('dzdarkom_cache_services'));

  // Selected Detail Modals
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(
    null
  );
  const [selectedArtisan, setSelectedArtisan] = useState<ArtisanRecord | null>(
    null
  );
  const [selectedRequest, setSelectedRequest] =
    useState<ServiceRequestRecord | null>(null);
  const [contactTarget, setContactTarget] = useState<ContactTarget | null>(
    null
  );

  // Auth & Portal Drawer
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<PortalTab>('project');
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(
    null
  );
  const [editingArtisan, setEditingArtisan] = useState<ArtisanRecord | null>(
    null
  );

  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const showcaseRef = useRef<HTMLElement | null>(null);
  const frameRefs = useRef<(HTMLElement | null)[]>([]);
  const bentoGridRef = useRef<HTMLDivElement | null>(null);
  const compWrapRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const stageIdxRef = useRef(0);
  const stageTimerRef = useRef<number | null>(null);

  const t = UI_COPY[lang];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // 1. Live Firestore Projects Feed
  useEffect(() => {
    const q = query(
      collection(db, 'projects'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: ProjectRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || ''),
            category: (data.category as ProjectCategory) || 'ceramics',
            location: String(data.location || ''),
            areaSqm: String(data.areaSqm || ''),
            description: String(data.description || ''),
            coverImage: String(data.coverImage || ''),
            beforeImage: data.beforeImage ? String(data.beforeImage) : '',
            completedServices: Array.isArray(data.completedServices)
              ? data.completedServices.map(String)
              : [],
            artisanId: data.artisanId ? String(data.artisanId) : '',
            ownerId: String(data.ownerId || ''),
            ownerName: String(data.ownerName || 'فريق اخدم دارك'),
            isCurated: false,
          };
        });
        setFirestoreProjects(list);
        writeCachedList('dzdarkom_cache_projects', list);
        setProjectsLoading(false);
      },
      (error) => {
        setProjectsLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'projects');
      }
    );
    return () => unsub();
  }, []);

  // 2. Live Firestore Team Profiles Feed
  useEffect(() => {
    const q = query(
      collection(db, 'artisans'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: ArtisanRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            displayName: String(data.displayName || ''),
            roleTitle: data.roleTitle ? String(data.roleTitle) : '',
            profession:
              (data.profession as ServiceCategoryId) || 'construction_renovation',
            experienceYears: Number(data.experienceYears || 0),
            wilaya: String(data.wilaya || ''),
            commune: String(data.commune || ''),
            bio: String(data.bio || ''),
            skillsList: Array.isArray(data.skillsList)
              ? data.skillsList.map(String)
              : [],
            avatarUrl: String(data.avatarUrl || ''),
            ownerId: String(data.ownerId || ''),
            isCurated: false,
          };
        });
        setArtisans(list);
        writeCachedList('dzdarkom_cache_artisans', list);
        setArtisansLoading(false);
      },
      (error) => {
        setArtisansLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'artisans');
      }
    );
    return () => unsub();
  }, []);

  // 3. Live Firestore Customer Service Requests
  useEffect(() => {
    const q = query(
      collection(db, 'requests'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: ServiceRequestRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || ''),
            category:
              (data.category as ServiceCategoryId) || 'construction_renovation',
            wilaya: String(data.wilaya || ''),
            commune: String(data.commune || ''),
            description: String(data.description || ''),
            coverImage: String(data.coverImage || ''),
            status:
              (data.status as 'open' | 'in_progress' | 'closed') || 'open',
            ownerId: String(data.ownerId || ''),
            ownerName: String(data.ownerName || 'زبون'),
          };
        });
        setRequests(list);
        writeCachedList('dzdarkom_cache_requests', list);
        setRequestsLoading(false);
      },
      (error) => {
        setRequestsLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'requests');
      }
    );
    return () => unsub();
  }, []);

  // 4. Live Firestore Team Skills Feed
  useEffect(() => {
    const q = query(collection(db, 'skills'), orderBy('sortOrder', 'asc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: TeamSkillRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            nameAr: String(data.nameAr || ''),
            nameFr: String(data.nameFr || data.nameAr || ''),
            category: (data.category as ServiceCategoryId) || 'ceramics',
            level: (data.level as SkillLevelId) || 'expert',
            summaryAr: String(data.summaryAr || ''),
            summaryFr: String(data.summaryFr || data.summaryAr || ''),
            toolsAr: String(data.toolsAr || ''),
            sortOrder: Number(data.sortOrder || 0),
            ownerId: String(data.ownerId || ''),
            isCurated: false,
          };
        });
        setFirestoreSkills(list);
        writeCachedList('dzdarkom_cache_skills', list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'skills');
      }
    );
    return () => unsub();
  }, []);

  // 5. Live Firestore Detailed Services Guide Feed
  useEffect(() => {
    const q = query(collection(db, 'services'), orderBy('sortOrder', 'asc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: TeamServiceGuideRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            titleAr: String(data.titleAr || ''),
            titleFr: String(data.titleFr || data.titleAr || ''),
            category: (data.category as ServiceCategoryId) || 'ceramics',
            natureAr: String(data.natureAr || ''),
            natureFr: String(data.natureFr || data.natureAr || ''),
            deliverablesAr: String(data.deliverablesAr || ''),
            deliverablesFr: String(
              data.deliverablesFr || data.deliverablesAr || ''
            ),
            stagesAr: String(data.stagesAr || ''),
            stagesFr: String(data.stagesFr || data.stagesAr || ''),
            outcomeAr: String(data.outcomeAr || ''),
            outcomeFr: String(data.outcomeFr || data.outcomeAr || ''),
            durationLabel: String(data.durationLabel || ''),
            sortOrder: Number(data.sortOrder || 0),
            ownerId: String(data.ownerId || ''),
            isCurated: false,
          };
        });
        setFirestoreServices(list);
        writeCachedList('dzdarkom_cache_services', list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'services');
      }
    );
    return () => unsub();
  }, []);

  // WebGL + Lenis + GSAP Scroll Showcase
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const cleanupHeroGl = initHeroCanvas(heroCanvasRef.current);
    const cleanupSpecsGl = initSpecsCanvas(specsCanvasRef.current);

    let lenis: InstanceType<typeof Lenis> | null = null;
    let lenisTicker: ((time: number) => void) | null = null;
    if (!prefersReduced) {
      lenis = new Lenis({
        duration: 1.0,
        easing: (tVal: number) => Math.min(1, 1.001 - Math.pow(2, -10 * tVal)),
        smoothWheel: true,
      });
      lenis.on('scroll', ScrollTrigger.update);
      lenisTicker = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(lenisTicker);
      gsap.ticker.lagSmoothing(0);
    }

    const gsapCtx = gsap.context(() => {
      if (prefersReduced) return;

      const frames = frameRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      if (showcaseRef.current && frames.length === 4) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: showcaseRef.current,
            start: 'top top',
            end: '+=240%',
            pin: true,
            scrub: 0.65,
            onUpdate: (self: { progress: number }) => {
              const tPos = self.progress * 3.5;
              let nextIdx = 0;
              if (tPos >= 3.07) nextIdx = 3;
              else if (tPos >= 2.02) nextIdx = 2;
              else if (tPos >= 0.97) nextIdx = 1;

              if (nextIdx !== stageIdxRef.current) {
                stageIdxRef.current = nextIdx;
                setCaptionBlur(true);
                if (stageTimerRef.current !== null) {
                  window.clearTimeout(stageTimerRef.current);
                }
                stageTimerRef.current = window.setTimeout(() => {
                  stageTimerRef.current = null;
                  setActiveStage(nextIdx);
                  setCaptionBlur(false);
                }, 100);
              }
            },
          },
        });

        const wipeStarts = [0.25, 1.3, 2.35];
        frames.forEach((frame, i) => {
          if (i === 0) return;
          tl.fromTo(
            frame,
            { clipPath: 'inset(0 0 0 100%)' },
            { clipPath: 'inset(0 0 0 0%)', ease: 'none', duration: 0.8 },
            wipeStarts[i - 1]
          );
        });
        tl.set({}, {}, 3.5);
      }

      if (bentoGridRef.current) {
        gsap.from('.reveal-tile', {
          y: 24,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: bentoGridRef.current,
            start: 'top 84%',
            once: true,
          },
        });
      }
    });

    return () => {
      if (stageTimerRef.current !== null) {
        window.clearTimeout(stageTimerRef.current);
      }
      cleanupHeroGl();
      cleanupSpecsGl();
      gsapCtx.revert();
      if (lenisTicker) gsap.ticker.remove(lenisTicker);
      lenis?.destroy();
    };
  }, []);

  const isAdmin =
    !!user && user.emailVerified && user.email === ADMIN_EMAIL;

  const displayedSkills = useMemo(
    () => (firestoreSkills.length > 0 ? firestoreSkills : CURATED_SKILLS),
    [firestoreSkills]
  );

  const displayedServices = useMemo(
    () =>
      firestoreServices.length > 0 ? firestoreServices : CURATED_SERVICES,
    [firestoreServices]
  );

  const displayedArtisans = useMemo(
    () => (artisans.length > 0 ? artisans : CURATED_TEAM_MEMBERS),
    [artisans]
  );

  const allProjects = useMemo(
    () => [...firestoreProjects, ...CURATED_PROJECTS],
    [firestoreProjects]
  );

  const activeWilayaObj = useMemo(
    () => ALGERIA_WILAYAS.find((w) => w.ar === filterWilaya),
    [filterWilaya]
  );

  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return displayedSkills.filter((sk) => {
      if (filterProfession !== 'all' && sk.category !== filterProfession)
        return false;
      if (!q) return true;
      return (
        sk.nameAr.toLowerCase().includes(q) ||
        sk.nameFr.toLowerCase().includes(q) ||
        sk.summaryAr.toLowerCase().includes(q) ||
        sk.summaryFr.toLowerCase().includes(q) ||
        sk.toolsAr.toLowerCase().includes(q)
      );
    });
  }, [displayedSkills, filterProfession, searchQuery]);

  const activeServiceGuide = useMemo(() => {
    if (displayedServices.length === 0) return null;
    const byId = displayedServices.find((s) => s.id === selectedServiceId);
    if (byId) return byId;
    if (filterProfession !== 'all') {
      const byCat = displayedServices.find(
        (s) => s.category === filterProfession
      );
      if (byCat) return byCat;
    }
    return displayedServices[0];
  }, [displayedServices, selectedServiceId, filterProfession]);

  const filteredArtisans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const com = filterCommune.trim().toLowerCase();
    return displayedArtisans.filter((art) => {
      if (filterProfession !== 'all' && art.profession !== filterProfession)
        return false;
      if (
        filterWilaya !== 'all' &&
        art.wilaya !== filterWilaya &&
        art.wilaya !== activeWilayaObj?.fr
      )
        return false;
      if (com && !art.commune.toLowerCase().includes(com)) return false;
      if (!q) return true;
      return (
        art.displayName.toLowerCase().includes(q) ||
        (art.roleTitle || '').toLowerCase().includes(q) ||
        art.bio.toLowerCase().includes(q) ||
        art.wilaya.toLowerCase().includes(q) ||
        art.commune.toLowerCase().includes(q) ||
        (art.skillsList || []).some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [
    displayedArtisans,
    filterProfession,
    filterWilaya,
    activeWilayaObj,
    filterCommune,
    searchQuery,
  ]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const com = filterCommune.trim().toLowerCase();
    return requests.filter((req) => {
      if (filterProfession !== 'all' && req.category !== filterProfession)
        return false;
      if (
        filterWilaya !== 'all' &&
        req.wilaya !== filterWilaya &&
        req.wilaya !== activeWilayaObj?.fr
      )
        return false;
      if (com && !req.commune.toLowerCase().includes(com)) return false;
      if (!q) return true;
      return (
        req.title.toLowerCase().includes(q) ||
        req.description.toLowerCase().includes(q) ||
        req.wilaya.toLowerCase().includes(q) ||
        req.commune.toLowerCase().includes(q)
      );
    });
  }, [
    requests,
    filterProfession,
    filterWilaya,
    activeWilayaObj,
    filterCommune,
    searchQuery,
  ]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const com = filterCommune.trim().toLowerCase();
    return allProjects.filter((p) => {
      if (!matchesCategoryFilter(p.category, filterProfession)) return false;
      if (
        filterWilaya !== 'all' &&
        !p.location.includes(filterWilaya) &&
        !(activeWilayaObj && p.location.includes(activeWilayaObj.fr))
      ) {
        return false;
      }
      if (com && !p.location.toLowerCase().includes(com)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.completedServices || []).some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [
    allProjects,
    filterProfession,
    filterWilaya,
    activeWilayaObj,
    filterCommune,
    searchQuery,
  ]);

  const userProjects = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return firestoreProjects;
    return firestoreProjects.filter((p) => p.ownerId === user.uid);
  }, [firestoreProjects, user, isAdmin]);

  const userArtisans = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return artisans;
    return artisans.filter((a) => a.ownerId === user.uid);
  }, [artisans, user, isAdmin]);

  const heroSpotlights = useMemo(
    () => [
      {
        id: 'travertine',
        label: lang === 'ar' ? 'بورسلان ترافرتين' : 'Grès Travertin',
        title:
          lang === 'ar'
            ? 'تشطيب صالون بالبورسلان الترافرتين'
            : 'Salon en grès cérame Travertin',
        src: GENERATED_ASSETS.heroVilla,
        alt: 'Travertine porcelain salon renovation',
      },
      {
        id: 'welding',
        label: lang === 'ar' ? 'لحام وحدادة' : 'Soudure & Acier',
        title:
          lang === 'ar'
            ? 'سلالم وهياكل معدنية مصممة في الورشة'
            : 'Escaliers et ferronnerie d’atelier',
        src: GENERATED_ASSETS.weldingCraft,
        alt: 'Architectural metalwork and TIG welding craft',
      },
      {
        id: 'facade',
        label: lang === 'ar' ? 'واجهات وحجر' : 'Façades & Pierre',
        title:
          lang === 'ar'
            ? 'بناء وتكسية واجهة بالحجر الطبيعي'
            : 'Construction et façade en pierre',
        src: GENERATED_ASSETS.exteriorFacade,
        alt: 'Stone clad villa exterior',
      },
    ],
    [lang]
  );

  const showcaseStages = useMemo(
    () => [
      {
        src: GENERATED_ASSETS.heroVilla,
        alt: t.showcaseTitle1,
        title: t.showcaseTitle1,
        sub: t.showcaseSub1,
      },
      {
        src: GENERATED_ASSETS.ceramicArtisan,
        alt: t.showcaseTitle2,
        title: t.showcaseTitle2,
        sub: t.showcaseSub2,
      },
      {
        src: GENERATED_ASSETS.kitchenMarble,
        alt: t.showcaseTitle3,
        title: t.showcaseTitle3,
        sub: t.showcaseSub3,
      },
      {
        src: GENERATED_ASSETS.exteriorFacade,
        alt: t.showcaseTitle4,
        title: t.showcaseTitle4,
        sub: t.showcaseSub4,
      },
    ],
    [t]
  );

  const openPortal = (tab: PortalTab) => {
    setEditingProject(null);
    setEditingArtisan(null);
    setDrawerTab(tab);
    setDrawerOpen(true);
  };

  const selectStage = (idx: number) => {
    stageIdxRef.current = idx;
    setCaptionBlur(true);
    if (stageTimerRef.current !== null) {
      window.clearTimeout(stageTimerRef.current);
    }
    stageTimerRef.current = window.setTimeout(() => {
      stageTimerRef.current = null;
      setActiveStage(idx);
      setCaptionBlur(false);
    }, 100);
    frameRefs.current.forEach((frame, i) => {
      if (!frame) return;
      frame.style.clipPath =
        i <= idx ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)';
    });
  };

  const updateSplit = (pct: number, animate: boolean) => {
    const clamped = Math.max(0, Math.min(100, pct));
    setSplitAnimate(animate);
    setSplitPct(clamped);
  };

  const handleCompPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
  };

  const handleCompPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
  };

  const handleCompPointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setEditingProject(null);
    setEditingArtisan(null);
  };

  const handleDeleteProject = async (project: ProjectRecord) => {
    if (project.isCurated || !user) return;
    const projectPath = `projects/${project.id}`;
    const photosSnap = await getDocs(
      collection(db, 'projects', project.id, 'photos')
    );
    for (const photoDoc of photosSnap.docs) {
      await deleteDoc(
        doc(db, 'projects', project.id, 'photos', photoDoc.id)
      ).catch((err) =>
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `projects/${project.id}/photos/${photoDoc.id}`
        )
      );
    }
    await deleteDoc(doc(db, 'projects', project.id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, projectPath)
    );
    if (selectedProject?.id === project.id) setSelectedProject(null);
    if (editingProject?.id === project.id) setEditingProject(null);
  };

  const handleDeleteArtisan = async (artisan: ArtisanRecord) => {
    if (artisan.isCurated || !user) return;
    const artPath = `artisans/${artisan.id}`;
    const photosSnap = await getDocs(
      collection(db, 'artisans', artisan.id, 'photos')
    );
    for (const photoDoc of photosSnap.docs) {
      await deleteDoc(
        doc(db, 'artisans', artisan.id, 'photos', photoDoc.id)
      ).catch((err) =>
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `artisans/${artisan.id}/photos/${photoDoc.id}`
        )
      );
    }
    await deleteDoc(doc(db, 'artisans', artisan.id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, artPath)
    );
    if (selectedArtisan?.id === artisan.id) setSelectedArtisan(null);
    if (editingArtisan?.id === artisan.id) setEditingArtisan(null);
  };

  const handleDeleteRequest = async (req: ServiceRequestRecord) => {
    if (!user) return;
    const reqPath = `requests/${req.id}`;
    const photosSnap = await getDocs(
      collection(db, 'requests', req.id, 'photos')
    );
    for (const photoDoc of photosSnap.docs) {
      await deleteDoc(
        doc(db, 'requests', req.id, 'photos', photoDoc.id)
      ).catch((err) =>
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `requests/${req.id}/photos/${photoDoc.id}`
        )
      );
    }
    await deleteDoc(doc(db, 'requests', req.id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, reqPath)
    );
    if (selectedRequest?.id === req.id) setSelectedRequest(null);
  };

  const activeSpot = heroSpotlights[heroSpotIdx];

  const activeServiceDeliverables = useMemo(() => {
    if (!activeServiceGuide) return [];
    const raw =
      lang === 'ar'
        ? activeServiceGuide.deliverablesAr
        : activeServiceGuide.deliverablesFr;
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [activeServiceGuide, lang]);

  const activeServiceStages = useMemo(() => {
    if (!activeServiceGuide) return [];
    const raw =
      lang === 'ar'
        ? activeServiceGuide.stagesAr
        : activeServiceGuide.stagesFr;
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [activeServiceGuide, lang]);

  return (
    <>
      <header className="site-header" id="site-header">
        <div className="container header-inner">
          <a href="#hero" className="brand-lockup">
            <svg
              className="brand-mark"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 10.5L12 3L21 10.5V20H14.5V14H9.5V20H3V10.5Z"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinejoin="round"
              />
            </svg>
            <span>{t.brand}</span>
          </a>

          <nav className="header-nav" aria-label="Primary">
            <a href="#skills" className="nav-link">
              {t.navSkills}
            </a>
            <a href="#services-guide" className="nav-link">
              {t.navServices}
            </a>
            <a href="#artisans" className="nav-link">
              {t.navPros}
            </a>
            <a href="#gallery" className="nav-link">
              {t.navGallery}
            </a>
            <a href="#requests" className="nav-link">
              {t.navRequests}
            </a>
          </nav>

          <button
            type="button"
            className="btn btn-primary btn-sm header-action"
            onClick={() => openPortal(isAdmin ? 'admin' : 'request')}
          >
            {isAdmin ? <ShieldCheck size={16} /> : <Plus size={16} />}
            <span>{user ? t.headerCtaSignedIn : t.headerCtaGuest}</span>
          </button>
        </div>
      </header>

      <main>
        {/* SECTION 1: Hero + Language Toggle + 4-Column Proof Strip */}
        <section id="hero" className="hero">
          <canvas
            ref={heroCanvasRef}
            className="hero-canvas"
            aria-hidden="true"
          />

          <div className="container hero-inner">
            <div className="hero-grid">
              <div className="hero-copy">
                <div className="hero-top-row">
                  <p className="hero-kicker">{t.heroKicker}</p>
                  <div
                    className="lang-switch"
                    role="group"
                    aria-label="Language switcher"
                  >
                    <button
                      type="button"
                      className={`lang-btn${lang === 'ar' ? ' is-active' : ''}`}
                      onClick={() => setLang('ar')}
                    >
                      العربية
                    </button>
                    <button
                      type="button"
                      className={`lang-btn${lang === 'fr' ? ' is-active' : ''}`}
                      onClick={() => setLang('fr')}
                    >
                      Français
                    </button>
                  </div>
                </div>

                <h1 className="hero-title">{t.heroTitle}</h1>
                <p className="hero-sub">{t.heroSub}</p>

                <div className="hero-actions">
                  <a href="#artisans" className="btn btn-primary">
                    {t.heroBrowsePros}
                  </a>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => openPortal('request')}
                  >
                    <span>{t.heroPostRequest}</span>
                    <ArrowUpLeft size={16} />
                  </button>
                  <PWAInstallButton lang={lang} variant="hero" />
                </div>
              </div>

              <div className="hero-stage">
                <div className="hero-media-frame">
                  <img
                    src={activeSpot.src}
                    alt={activeSpot.alt}
                    className="hero-media-img"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="hero-media-caption">
                  <span className="hero-spot-label">{activeSpot.title}</span>
                  <div className="hero-spot-tabs" role="tablist">
                    {heroSpotlights.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={heroSpotIdx === idx}
                        className={`spot-tab${
                          heroSpotIdx === idx ? ' is-active' : ''
                        }`}
                        onClick={() => setHeroSpotIdx(idx)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-kpi-strip">
              <div className="kpi-cell">
                <span className="kpi-num tabular-nums">
                  {displayedArtisans.length}
                </span>
                <span className="kpi-label">{t.kpiPros}</span>
              </div>
              <div className="kpi-cell">
                <span className="kpi-num tabular-nums">
                  {displayedSkills.length}
                </span>
                <span className="kpi-label">{t.kpiSkills}</span>
              </div>
              <div className="kpi-cell">
                <span className="kpi-num tabular-nums">
                  {allProjects.length}
                </span>
                <span className="kpi-label">{t.kpiWorks}</span>
              </div>
              <div className="kpi-cell">
                <span className="kpi-num tabular-nums">58</span>
                <span className="kpi-label">{t.kpiCoverage}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Unified Search Engine (Profession, Wilaya, Commune) */}
        <section id="search" className="search-section">
          <div className="container search-engine-box">
            <div>
              <h2 className="section-title">{t.searchTitle}</h2>
              <p className="section-sub">{t.searchSub}</p>
            </div>

            <div className="search-grid">
              <div className="search-input-wrap">
                <Search size={16} className="gallery-search-icon" />
                <input
                  type="search"
                  className="gallery-search-input"
                  placeholder={t.searchKeywordPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-input"
                aria-label={t.searchProfessionAll}
                value={filterProfession}
                onChange={(e) =>
                  setFilterProfession(
                    e.target.value as ServiceCategoryId | 'all'
                  )
                }
              >
                <option value="all">{t.searchProfessionAll}</option>
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'ar' ? c.ar : c.fr}
                  </option>
                ))}
              </select>

              <select
                className="form-input"
                aria-label={t.searchWilayaAll}
                value={filterWilaya}
                onChange={(e) => {
                  setFilterWilaya(e.target.value);
                  setFilterCommune('');
                }}
              >
                <option value="all">{t.searchWilayaAll}</option>
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.ar}>
                    {w.code} - {lang === 'ar' ? w.ar : w.fr}
                  </option>
                ))}
              </select>

              <div>
                <input
                  type="text"
                  list="search-communes-list"
                  className="form-input"
                  placeholder={t.searchCommunePlaceholder}
                  value={filterCommune}
                  onChange={(e) => setFilterCommune(e.target.value)}
                />
                <datalist id="search-communes-list">
                  {(activeWilayaObj?.communes || []).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setFilterProfession('all');
                  setFilterWilaya('all');
                  setFilterCommune('');
                  setSearchQuery('');
                }}
              >
                {t.searchReset}
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 3: Team Specialties (9 Disciplines including Ceramics, Construction, Welding, Electricity, Plumbing) */}
        <section id="categories" className="categories-section">
          <div className="container">
            <h2 className="section-title">{t.categoriesTitle}</h2>
            <p className="section-sub">{t.categoriesSub}</p>

            <div className="categories-grid">
              {SERVICE_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id];
                const isActive = filterProfession === cat.id;
                const skillCount = displayedSkills.filter(
                  (sk) => sk.category === cat.id
                ).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-card${isActive ? ' is-active' : ''}`}
                    onClick={() => {
                      const nextFilter = isActive ? 'all' : cat.id;
                      setFilterProfession(nextFilter);
                      const matchingService = displayedServices.find(
                        (s) => s.category === cat.id
                      );
                      if (matchingService) {
                        setSelectedServiceId(matchingService.id);
                      }
                      document
                        .getElementById('services-guide')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <div className="category-card-head">
                      <Icon size={22} />
                      <span className="project-meta-line tabular-nums">
                        {skillCount}
                      </span>
                    </div>
                    <h3 className="category-card-title">
                      {lang === 'ar' ? cat.ar : cat.fr}
                    </h3>
                    <p className="category-card-desc">
                      {lang === 'ar' ? cat.descAr : cat.descFr}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4: Team Skills & Expertise (Admin Managed) */}
        <section id="skills" className="skills-section">
          <div className="container">
            <div className="gallery-header">
              <div>
                <h2 className="section-title">{t.skillsTitle}</h2>
                <p className="section-sub">{t.skillsSub}</p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openPortal('admin')}
                >
                  <ShieldCheck size={17} />
                  <span>{t.skillsManageBtn}</span>
                </button>
              )}
            </div>

            {filteredSkills.length === 0 ? (
              <div className="gallery-empty">
                <p>{t.galleryEmpty}</p>
              </div>
            ) : (
              <div className="skills-grid">
                {filteredSkills.map((sk, idx) => {
                  const Icon = CATEGORY_ICONS[sk.category] || Hammer;
                  return (
                    <RevealBlock key={sk.id} delay={(idx % 4) * 0.04}>
                      <SpotlightCard className="skill-card">
                        <div className="skill-card-head">
                          <Icon size={20} />
                          <span className="skill-level-label">
                            {getSkillLevelLabel(sk.level, lang)}
                          </span>
                        </div>
                        <span className="project-meta-line">
                          {getCategoryLabel(sk.category, lang)}
                        </span>
                        <h3 className="skill-card-title">
                          {lang === 'ar' ? sk.nameAr : sk.nameFr}
                        </h3>
                        <p className="skill-card-desc">
                          {lang === 'ar' ? sk.summaryAr : sk.summaryFr}
                        </p>
                        {sk.toolsAr && (
                          <p className="skill-tools-line">{sk.toolsAr}</p>
                        )}
                      </SpotlightCard>
                    </RevealBlock>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 5: Detailed Service Explanations (Nature, Deliverables, Stages, Outcome) */}
        <section id="services-guide" className="services-guide-section">
          <div className="container">
            <div className="gallery-header">
              <div>
                <h2 className="section-title">{t.servicesGuideTitle}</h2>
                <p className="section-sub">{t.servicesGuideSub}</p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => openPortal('admin')}
                >
                  <ShieldCheck size={16} />
                  <span>
                    {lang === 'ar' ? 'تعديل الشروحات' : 'Gérer les fiches'}
                  </span>
                </button>
              )}
            </div>

            {activeServiceGuide && (
              <div className="services-guide-shell">
                <div className="services-nav-list" role="tablist">
                  {displayedServices.map((srv) => {
                    const isSelected = srv.id === activeServiceGuide.id;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        className={`services-nav-btn${
                          isSelected ? ' is-active' : ''
                        }`}
                        onClick={() => setSelectedServiceId(srv.id)}
                      >
                        <div>
                          <div className="services-nav-title">
                            {lang === 'ar' ? srv.titleAr : srv.titleFr}
                          </div>
                          <div className="services-nav-sub">
                            {getCategoryLabel(srv.category, lang)}
                          </div>
                        </div>
                        {lang === 'ar' ? (
                          <ChevronLeft size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <RevealBlock
                  key={activeServiceGuide.id}
                  className="service-detail-panel"
                >
                  <div className="service-detail-head">
                    <div>
                      <span className="project-meta-line">
                        {getCategoryLabel(activeServiceGuide.category, lang)}
                      </span>
                      <h3 className="service-detail-title">
                        {lang === 'ar'
                          ? activeServiceGuide.titleAr
                          : activeServiceGuide.titleFr}
                      </h3>
                    </div>
                    <span className="service-duration-note">
                      {t.servicesDurationLbl} {activeServiceGuide.durationLabel}
                    </span>
                  </div>

                  <div className="service-quad-grid">
                    <div className="service-quad-card">
                      <span className="service-quad-label">
                        {t.servicesNatureLbl}
                      </span>
                      <p className="service-quad-text">
                        {lang === 'ar'
                          ? activeServiceGuide.natureAr
                          : activeServiceGuide.natureFr}
                      </p>
                    </div>

                    <div className="service-quad-card">
                      <span className="service-quad-label">
                        {t.servicesOutcomeLbl}
                      </span>
                      <p className="service-quad-text">
                        {lang === 'ar'
                          ? activeServiceGuide.outcomeAr
                          : activeServiceGuide.outcomeFr}
                      </p>
                    </div>

                    <div className="service-quad-card">
                      <span className="service-quad-label">
                        {t.servicesDeliverablesLbl}
                      </span>
                      <ul className="service-bullet-list">
                        {activeServiceDeliverables.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="service-quad-card">
                      <span className="service-quad-label">
                        {t.servicesStagesLbl}
                      </span>
                      <ul className="service-bullet-list">
                        {activeServiceStages.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="service-detail-foot">
                    <span className="project-meta-line">
                      {lang === 'ar'
                        ? 'تنفيذ مباشر بإشراف فريق DZ Darkom Pro'
                        : 'Exécution directe par l’équipe DZ Darkom Pro'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => openPortal('request')}
                    >
                      <span>{t.servicesRequestCta}</span>
                      <ArrowUpLeft size={15} />
                    </button>
                  </div>
                </RevealBlock>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 6: Official Team Craftsman Profiles */}
        <section id="artisans" className="artisans-section">
          <div className="container">
            <div className="gallery-header">
              <div>
                <h2 className="section-title">{t.prosTitle}</h2>
                <p className="section-sub">{t.prosSub}</p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openPortal('artisan')}
                >
                  <Plus size={17} />
                  <span>{t.prosRegisterBtn}</span>
                </button>
              )}
            </div>

            {artisansLoading && artisans.length === 0 && displayedArtisans.length === 0 ? (
              <div className="gallery-empty">
                <p>...</p>
              </div>
            ) : filteredArtisans.length === 0 ? (
              <div className="gallery-empty">
                <p>
                  <strong>{t.prosEmpty}</strong>
                </p>
                <p style={{ marginTop: 8 }}>{t.prosEmptyHint}</p>
              </div>
            ) : (
              <div className="artisans-grid">
                {filteredArtisans.map((art, idx) => {
                  const memberProjectsCount = allProjects.filter(
                    (p) =>
                      p.artisanId === art.id ||
                      (p.ownerId !== 'curated' && p.ownerId === art.ownerId)
                  ).length;

                  return (
                    <RevealBlock key={art.id} delay={(idx % 3) * 0.05}>
                      <SpotlightCard className="artisan-card">
                        <div className="artisan-card-head">
                          {art.avatarUrl ? (
                            <img
                              src={art.avatarUrl}
                              alt={art.displayName}
                              className="artisan-avatar"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="artisan-avatar">
                              {art.displayName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h3 className="artisan-name">{art.displayName}</h3>
                            <div className="project-meta-line">
                              <span>
                                {art.roleTitle ||
                                  getCategoryLabel(art.profession, lang)}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                {art.experienceYears} {t.prosYearsExp}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="project-meta-line">
                          <span>{getCategoryLabel(art.profession, lang)}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {art.wilaya} - {art.commune}
                          </span>
                          {memberProjectsCount > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                {memberProjectsCount}{' '}
                                {lang === 'ar' ? 'أعمال' : 'projets'}
                              </span>
                            </>
                          )}
                        </div>

                        {art.skillsList && art.skillsList.length > 0 && (
                          <p className="artisan-skills-line">
                            {art.skillsList.join(' · ')}
                          </p>
                        )}

                        <p className="project-card-desc">{art.bio}</p>

                        <div className="artisan-card-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedArtisan(art)}
                          >
                            {t.prosViewProfile}
                          </button>
                          {!art.isCurated && (!user || user.uid !== art.ownerId) ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                setContactTarget({
                                  recipientOwnerId: art.ownerId,
                                  recipientName: art.displayName,
                                  contextType: 'artisan',
                                  contextId: art.id,
                                  contextTitle: `${getCategoryLabel(
                                    art.profession,
                                    lang
                                  )} · ${art.wilaya}`,
                                })
                              }
                            >
                              <MessageSquare size={14} />
                              <span>{t.prosContactBtn}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => openPortal('request')}
                            >
                              <span>{t.heroPostRequest}</span>
                            </button>
                          )}
                        </div>
                      </SpotlightCard>
                    </RevealBlock>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 7: Customer Service Requests to Our Team */}
        <section id="requests" className="requests-section">
          <div className="container">
            <div className="gallery-header">
              <div>
                <h2 className="section-title">{t.requestsTitle}</h2>
                <p className="section-sub">{t.requestsSub}</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openPortal('request')}
              >
                <Plus size={17} />
                <span>{t.requestsNewBtn}</span>
              </button>
            </div>

            {requestsLoading && requests.length === 0 ? (
              <div className="gallery-empty">
                <p>...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="gallery-empty">
                <p>
                  <strong>{t.requestsEmpty}</strong>
                </p>
                <p style={{ marginTop: 8 }}>{t.requestsEmptyHint}</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 16 }}
                  onClick={() => openPortal('request')}
                >
                  <Plus size={15} />
                  <span>{t.requestsNewBtn}</span>
                </button>
              </div>
            ) : (
              <div className="requests-grid">
                {filteredRequests.map((req) => {
                  const statusText =
                    req.status === 'open'
                      ? t.statusOpen
                      : req.status === 'in_progress'
                        ? t.statusInProgress
                        : t.statusClosed;
                  return (
                    <article key={req.id} className="request-card">
                      {req.coverImage && (
                        <img
                          src={req.coverImage}
                          alt={req.title}
                          className="request-thumb-img"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="project-meta-line">
                        <span>{getCategoryLabel(req.category, lang)}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {req.wilaya} - {req.commune}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{statusText}</span>
                      </div>
                      <h3 className="project-card-title">{req.title}</h3>
                      <p className="project-card-desc">{req.description}</p>

                      <div className="request-card-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setSelectedRequest(req)}
                        >
                          {t.requestsDetailsBtn}
                        </button>
                        {(!user || user.uid !== req.ownerId) &&
                          req.status !== 'closed' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                setContactTarget({
                                  recipientOwnerId: req.ownerId,
                                  recipientName: req.ownerName,
                                  contextType: 'request',
                                  contextId: req.id,
                                  contextTitle: req.title,
                                })
                              }
                            >
                              <MessageSquare size={14} />
                              <span>{t.requestsOfferBtn}</span>
                            </button>
                          )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 8: Pinned 4-Stage Architectural Showcase (Preserved) */}
        <section id="showcase" ref={showcaseRef} className="showcase-pin">
          <div className="showcase-viewport">
            <div className="showcase-frames">
              {showcaseStages.map((stage, i) => (
                <figure
                  key={stage.src}
                  ref={(el: HTMLElement | null) => {
                    frameRefs.current[i] = el;
                  }}
                  className={`showcase-frame${i === 0 ? ' is-active' : ''}`}
                >
                  <img
                    src={stage.src}
                    alt={stage.alt}
                    className="showcase-img"
                    referrerPolicy="no-referrer"
                  />
                </figure>
              ))}
            </div>

            <div className="showcase-hud">
              <div
                className={`showcase-caption${captionBlur ? ' is-blurring' : ''}`}
              >
                <h2 className="caption-title">
                  {showcaseStages[activeStage].title}
                </h2>
                <p className="caption-sub">{showcaseStages[activeStage].sub}</p>
              </div>

              <div className="showcase-dots" role="tablist">
                {showcaseStages.map((_stage, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={activeStage === i}
                    className={`stage-dot${activeStage === i ? ' is-active' : ''}`}
                    aria-label={`${i + 1}`}
                    onClick={() => selectStage(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9: Before & After Renovation Comparison (Preserved) */}
        <section id="comparison" className="thermal-section">
          <div className="container thermal-grid">
            <div
              className="comparison-wrap"
              ref={compWrapRef}
              dir="ltr"
              onPointerDown={handleCompPointerDown}
              onPointerMove={handleCompPointerMove}
              onPointerUp={handleCompPointerUp}
              onPointerCancel={handleCompPointerUp}
            >
              <div className="comparison-layer">
                <img
                  src={GENERATED_ASSETS.afterFinished}
                  alt={t.compAfter}
                  className="comparison-img"
                  referrerPolicy="no-referrer"
                />
                <span className="comp-corner-tag comp-corner-right">
                  {t.compAfter}
                </span>
              </div>

              <div
                className="comparison-layer comparison-cold"
                style={{
                  clipPath: `inset(0 ${100 - splitPct}% 0 0)`,
                  transition: splitAnimate
                    ? 'clip-path 360ms var(--ease-out)'
                    : 'none',
                }}
              >
                <img
                  src={GENERATED_ASSETS.beforeConstruction}
                  alt={t.compBefore}
                  className="comparison-img"
                  referrerPolicy="no-referrer"
                />
                <span className="comp-corner-tag comp-corner-left">
                  {t.compBefore}
                </span>
              </div>

              <div
                className={`comparison-handle${
                  splitPct <= 2 || splitPct >= 98 ? ' is-edge' : ''
                }`}
                role="slider"
                tabIndex={0}
                aria-label={t.compTitle}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(splitPct)}
                style={{
                  left: `clamp(22px, ${splitPct}%, calc(100% - 22px))`,
                  transition: splitAnimate
                    ? 'left 360ms var(--ease-out)'
                    : 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') updateSplit(splitPct - 8, true);
                  if (e.key === 'ArrowRight') updateSplit(splitPct + 8, true);
                }}
              >
                <div className="handle-line" />
                <div className="handle-knob">
                  <MoveHorizontal size={18} />
                </div>
              </div>
            </div>

            <div className="thermal-copy">
              <h2 className="section-title">{t.compTitle}</h2>
              <p className="section-sub">{t.compSub}</p>

              <div className="segmented-control" role="tablist">
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct >= 98 ? ' is-active' : ''}`}
                  aria-selected={splitPct >= 98}
                  onClick={() => updateSplit(100, true)}
                >
                  {t.compBefore}
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct <= 2 ? ' is-active' : ''}`}
                  aria-selected={splitPct <= 2}
                  onClick={() => updateSplit(0, true)}
                >
                  {t.compAfter}
                </button>
              </div>

              <div className="thermal-metrics">
                <div className="metric-item">
                  <span className="metric-value tabular-nums">
                    {t.compMetric1Val}
                  </span>
                  <span className="metric-label">{t.compMetric1Lbl}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value tabular-nums">
                    {t.compMetric2Val}
                  </span>
                  <span className="metric-label">{t.compMetric2Lbl}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: Asymmetric Bento Craftsmanship (Preserved) */}
        <section id="services" className="bento-section">
          <div className="container">
            <div className="section-header-stack">
              <h2 className="section-title">{t.bentoTitle}</h2>
              <p className="section-sub">{t.bentoSub}</p>
            </div>

            <div className="bento-grid" ref={bentoGridRef}>
              <article className="bento-tile bento-tall reveal-tile">
                <img
                  src={GENERATED_ASSETS.ceramicArtisan}
                  alt={t.bentoTile1Title}
                  className="bento-img"
                  referrerPolicy="no-referrer"
                />
                <div className="bento-footer">
                  <h3 className="bento-title">{t.bentoTile1Title}</h3>
                  <p className="bento-sub">{t.bentoTile1Sub}</p>
                </div>
              </article>

              <article className="bento-tile bento-top reveal-tile">
                <img
                  src={GENERATED_ASSETS.kitchenMarble}
                  alt={t.bentoTile2Title}
                  className="bento-img"
                  referrerPolicy="no-referrer"
                />
                <div className="bento-footer">
                  <h3 className="bento-title">{t.bentoTile2Title}</h3>
                  <p className="bento-sub">{t.bentoTile2Sub}</p>
                </div>
              </article>

              <article className="bento-tile bento-bottom reveal-tile">
                <canvas
                  ref={specsCanvasRef}
                  className="specs-canvas"
                  aria-hidden="true"
                />
                <div className="bento-footer bento-footer-specs">
                  <div>
                    <h3 className="bento-title">{t.bentoTile3Title}</h3>
                    <p className="bento-sub">{t.bentoTile3Sub}</p>
                  </div>
                  <span className="bento-spec-note">{t.bentoSpecNote}</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* SECTION 11: Public Before/After Works Gallery */}
        <section id="gallery" className="gallery-section">
          <div className="container">
            <div className="gallery-header">
              <div>
                <h2 className="section-title">{t.galleryTitle}</h2>
                <p className="section-sub">{t.gallerySub}</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openPortal('project')}
              >
                <Plus size={17} />
                <span>{t.galleryAddBtn}</span>
              </button>
            </div>

            {projectsLoading && allProjects.length === 0 ? (
              <div className="gallery-empty">
                <p>...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="gallery-empty">
                <p>{t.galleryEmpty}</p>
              </div>
            ) : (
              <div className="projects-grid">
                {filteredProjects.map((project, idx) => (
                  <RevealBlock key={project.id} delay={(idx % 3) * 0.04}>
                    <button
                      type="button"
                      className="project-card w-full"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="project-thumb-wrap">
                        <img
                          src={project.coverImage}
                          alt={project.title}
                          className="project-thumb-img"
                          referrerPolicy="no-referrer"
                        />
                        {project.beforeImage && (
                          <span className="project-before-after-note">
                            {lang === 'ar' ? 'قبل / بعد' : 'Avant / Après'}
                          </span>
                        )}
                      </div>
                      <div className="project-card-body">
                        <div className="project-meta-line">
                          <span>
                            {getCategoryLabel(project.category, lang)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{project.location}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {project.areaSqm}
                          </span>
                        </div>
                        <h3 className="project-card-title">{project.title}</h3>
                        <p className="project-card-desc">
                          {project.description}
                        </p>
                        {project.completedServices &&
                          project.completedServices.length > 0 && (
                            <p className="artisan-skills-line">
                              {project.completedServices.slice(0, 3).join(' · ')}
                            </p>
                          )}
                        <div className="project-card-foot">
                          <span>{project.ownerName}</span>
                          <span className="project-view-cta">
                            {t.galleryViewPhotos}
                          </span>
                        </div>
                      </div>
                    </button>
                  </RevealBlock>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span className="footer-brand">{t.brand}</span>
          <span>{t.footerTag}</span>
          <div className="footer-actions">
            <PWAInstallButton lang={lang} variant="footer" />
            <button
              type="button"
              className="theme-switch-btn"
              onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
            >
              {lang === 'ar' ? 'Français' : 'العربية'}
            </button>
            <button
              type="button"
              className="theme-switch-btn"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === 'light' ? t.themeDark : t.themeLight}</span>
            </button>
            <span>© 2026 dz darkom pro</span>
          </div>
        </div>
      </footer>

      <OfflineIndicator lang={lang} />

      <ProjectLightbox
        project={selectedProject}
        user={user}
        isAdmin={isAdmin}
        lang={lang}
        onClose={() => setSelectedProject(null)}
        onEdit={(proj) => {
          setSelectedProject(null);
          setEditingProject(proj);
          setDrawerTab('project');
          setDrawerOpen(true);
        }}
        onDelete={handleDeleteProject}
      />

      <ArtisanProfileModal
        artisan={selectedArtisan}
        linkedProjects={
          selectedArtisan
            ? allProjects.filter(
                (p) =>
                  p.artisanId === selectedArtisan.id ||
                  (p.ownerId !== 'curated' &&
                    p.ownerId === selectedArtisan.ownerId)
              )
            : []
        }
        user={user}
        isAdmin={isAdmin}
        lang={lang}
        onClose={() => setSelectedArtisan(null)}
        onEdit={(art) => {
          setSelectedArtisan(null);
          setEditingArtisan(art);
          setDrawerTab('artisan');
          setDrawerOpen(true);
        }}
        onDelete={handleDeleteArtisan}
        onContact={(art) => {
          setSelectedArtisan(null);
          setContactTarget({
            recipientOwnerId: art.ownerId,
            recipientName: art.displayName,
            contextType: 'artisan',
            contextId: art.id,
            contextTitle: `${getCategoryLabel(art.profession, lang)} · ${
              art.wilaya
            }`,
          });
        }}
        onOpenProject={(proj) => {
          setSelectedArtisan(null);
          setSelectedProject(proj);
        }}
      />

      <RequestDetailModal
        request={selectedRequest}
        user={user}
        isAdmin={isAdmin}
        lang={lang}
        onClose={() => setSelectedRequest(null)}
        onDelete={handleDeleteRequest}
        onContact={(req) => {
          setSelectedRequest(null);
          setContactTarget({
            recipientOwnerId: req.ownerId,
            recipientName: req.ownerName,
            contextType: 'request',
            contextId: req.id,
            contextTitle: req.title,
          });
        }}
      />

      <ContactModal
        target={contactTarget}
        user={user}
        lang={lang}
        onClose={() => setContactTarget(null)}
        onSignIn={handleSignIn}
      />

      <ProjectManagerDrawer
        open={drawerOpen}
        initialTab={drawerTab}
        user={user}
        authLoading={authLoading}
        isAdmin={isAdmin}
        lang={lang}
        editingProject={editingProject}
        editingArtisan={editingArtisan}
        userProjects={userProjects}
        userArtisans={userArtisans}
        allArtisans={displayedArtisans}
        firestoreSkills={firestoreSkills}
        firestoreServices={firestoreServices}
        hasFirestoreArtisans={artisans.length > 0}
        onClose={() => setDrawerOpen(false)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onClearEditProject={() => setEditingProject(null)}
        onClearEditArtisan={() => setEditingArtisan(null)}
        onEditProject={(proj) => {
          setEditingProject(proj);
          setDrawerTab('project');
        }}
        onDeleteProject={handleDeleteProject}
        onEditArtisan={(art) => {
          setEditingArtisan(art);
          setDrawerTab('artisan');
        }}
        onDeleteArtisan={handleDeleteArtisan}
      />
    </>
  );
}
