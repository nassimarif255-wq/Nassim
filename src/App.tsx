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
  MoveHorizontal,
  Plus,
  Search,
  Sun,
  Moon,
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
  CATEGORY_LABELS,
  CURATED_PROJECTS,
  GENERATED_ASSETS,
  ProjectCategory,
  ProjectRecord,
  SHOWCASE_STAGES,
} from './data/showcaseDefaults';
import { ProjectLightbox } from './components/ProjectLightbox';
import { ProjectManagerDrawer } from './components/ProjectManagerDrawer';

gsap.registerPlugin(ScrollTrigger);

const HERO_SPOTLIGHTS = [
  {
    id: 'travertine',
    label: 'بورسلان ترافرتين',
    title: 'صالون فيلا بالبورسلان الترافرتين · حيدرة',
    src: GENERATED_ASSETS.heroVilla,
    alt: 'صالون حديث مبلط بالبورسلان الترافرتين الطبيعي',
  },
  {
    id: 'calacatta',
    label: 'ألواح كالاكاتا',
    title: 'مطبخ عصري بألواح الرخام السيراميكي · دالي إبراهيم',
    src: GENERATED_ASSETS.kitchenMarble,
    alt: 'مطبخ حديث بألواح البورسلان كالاكاتا',
  },
  {
    id: 'facade',
    label: 'حجر الواجهات',
    title: 'تكسية واجهة فيلا بالحجر الطبيعي · بجاية',
    src: GENERATED_ASSETS.exteriorFacade,
    alt: 'واجهة فيلا عصرية مكسوة بالحجر الطبيعي',
  },
];

const ADMIN_EMAIL = 'nassimarif255@gmail.com';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [heroSpotIdx, setHeroSpotIdx] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [captionBlur, setCaptionBlur] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [splitAnimate, setSplitAnimate] = useState(false);

  // Public gallery + filtering
  const [firestoreProjects, setFirestoreProjects] = useState<ProjectRecord[]>(
    []
  );
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<
    ProjectCategory | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(
    null
  );

  // Auth & User Portal
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Listen to Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Live Firestore public projects feed
  useEffect(() => {
    const projectsPath = 'projects';
    const q = query(
      collection(db, projectsPath),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: ProjectRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || ''),
            category: (data.category as ProjectCategory) || 'renovation',
            location: String(data.location || ''),
            areaSqm: String(data.areaSqm || ''),
            description: String(data.description || ''),
            coverImage: String(data.coverImage || ''),
            ownerId: String(data.ownerId || ''),
            ownerName: String(data.ownerName || 'عضو اخدم دارك'),
            isCurated: false,
          };
        });
        setFirestoreProjects(items);
        setProjectsLoading(false);
      },
      (error) => {
        setProjectsLoading(false);
        handleFirestoreError(error, OperationType.LIST, projectsPath);
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
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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
              const t = self.progress * 3.5;
              let nextIdx = 0;
              if (t >= 3.07) nextIdx = 3;
              else if (t >= 2.02) nextIdx = 2;
              else if (t >= 0.97) nextIdx = 1;

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

  const allProjects = useMemo(() => {
    return [...firestoreProjects, ...CURATED_PROJECTS];
  }, [firestoreProjects]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allProjects.filter((p) => {
      const catMatch =
        activeCategory === 'all' || p.category === activeCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [allProjects, activeCategory, searchQuery]);

  const userProjects = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return firestoreProjects;
    return firestoreProjects.filter((p) => p.ownerId === user.uid);
  }, [firestoreProjects, user, isAdmin]);

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
  };

  const handleDeleteProject = async (project: ProjectRecord) => {
    if (project.isCurated || !user) return;
    const projectPath = `projects/${project.id}`;
    try {
      const photosSnap = await getDocs(
        collection(db, 'projects', project.id, 'photos')
      );
      for (const photoDoc of photosSnap.docs) {
        const photoPath = `projects/${project.id}/photos/${photoDoc.id}`;
        await deleteDoc(
          doc(db, 'projects', project.id, 'photos', photoDoc.id)
        ).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, photoPath)
        );
      }
      await deleteDoc(doc(db, 'projects', project.id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, projectPath)
      );
      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
      }
      if (editingProject?.id === project.id) {
        setEditingProject(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, projectPath);
    }
  };

  const handleEditFromLightbox = (project: ProjectRecord) => {
    setSelectedProject(null);
    setEditingProject(project);
    setDrawerOpen(true);
  };

  const activeSpot = HERO_SPOTLIGHTS[heroSpotIdx];

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
            <span>اخدم دارك dz darkom pro</span>
          </a>

          <nav className="header-nav" aria-label="التنقل الرئيسي">
            <a href="#gallery" className="nav-link">
              معرض الأعمال
            </a>
            <a href="#showcase" className="nav-link">
              جولة المشاريع
            </a>
            <a href="#comparison" className="nav-link">
              قبل وبعد
            </a>
            <a href="#services" className="nav-link">
              التخصصات
            </a>
          </nav>

          <button
            type="button"
            className="btn btn-primary btn-sm header-action"
            onClick={() => {
              setEditingProject(null);
              setDrawerOpen(true);
            }}
          >
            <Plus size={16} />
            <span>{user ? 'إضافة عمل وصور' : 'بوابة المستخدم'}</span>
          </button>
        </div>
      </header>

      <main>
        {/* SECTION 1: Hero + 4-Column Proof Strip */}
        <section id="hero" className="hero">
          <canvas
            ref={heroCanvasRef}
            className="hero-canvas"
            aria-hidden="true"
          />

          <div className="container hero-inner">
            <div className="hero-grid">
              <div className="hero-copy">
                <p className="hero-kicker">
                  البناء · تركيب السيراميك والبورسلان · ترميم المنازل في الجزائر
                </p>
                <h1 className="hero-title">نبني، نبلّط، ونجدّد دارك بإتقان.</h1>
                <p className="hero-sub">
                  منصة <strong>اخدم دارك dz darkom pro</strong> تعرض للعامة أحدث
                  مشاريع البناء، تبليط السيراميك والبورسلان كبير المقاس، وترميم
                  الشقق والفيلات بتشطيب معماري متكامل، مع بوابة خاصة للمستخدم
                  لإضافة الصور والأعمال الجديدة مباشرة.
                </p>

                <div className="hero-actions">
                  <a href="#gallery" className="btn btn-primary">
                    تصفح الأعمال والصور
                  </a>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setEditingProject(null);
                      setDrawerOpen(true);
                    }}
                  >
                    <span>أضف عملاً جديداً</span>
                    <ArrowUpLeft size={16} />
                  </button>
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
                  <div
                    className="hero-spot-tabs"
                    role="tablist"
                    aria-label="اختيار نموذج التشطيب"
                  >
                    {HERO_SPOTLIGHTS.map((item, idx) => (
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
                <span className="kpi-num tabular-nums">+120</span>
                <span className="kpi-label">مشروع بناء وترميم منجز</span>
              </div>
              <div className="kpi-cell">
                <span className="kpi-num tabular-nums">18,500 م²</span>
                <span className="kpi-label">سيراميك وبورسلان مركّب بدقة</span>
              </div>
              <div className="kpi-cell">
                <span className="kpi-num tabular-nums">58 ولاية</span>
                <span className="kpi-label">جاهزية التنفيذ والمتابعة</span>
              </div>
              <div className="kpi-cell">
                <span className="kpi-num tabular-nums">
                  {allProjects.length}
                </span>
                <span className="kpi-label">عمل معروض حالياً في المعرض</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Pinned 4-Stage Architectural Showcase */}
        <section id="showcase" ref={showcaseRef} className="showcase-pin">
          <div className="showcase-viewport">
            <div className="showcase-frames">
              {SHOWCASE_STAGES.map((stage, i) => (
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
                  {SHOWCASE_STAGES[activeStage].title}
                </h2>
                <p className="caption-sub">
                  {SHOWCASE_STAGES[activeStage].sub}
                </p>
              </div>

              <div
                className="showcase-dots"
                role="tablist"
                aria-label="مراحل العرض المعماري"
              >
                {SHOWCASE_STAGES.map((stage, i) => (
                  <button
                    key={stage.title}
                    type="button"
                    role="tab"
                    aria-selected={activeStage === i}
                    className={`stage-dot${activeStage === i ? ' is-active' : ''}`}
                    aria-label={`المرحلة ${i + 1}`}
                    onClick={() => selectStage(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Before & After Renovation Comparison */}
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
                  alt="الشقة بعد انتهاء أعمال الترميم وتركيب البورسلان"
                  className="comparison-img"
                  referrerPolicy="no-referrer"
                />
                <span className="comp-corner-tag comp-corner-right">
                  بعد التسليم
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
                  alt="حالة الشقة أثناء البناء والطوب الأحمر قبل الترميم"
                  className="comparison-img"
                  referrerPolicy="no-referrer"
                />
                <span className="comp-corner-tag comp-corner-left">
                  قبل الأشغال
                </span>
              </div>

              <div
                className={`comparison-handle${
                  splitPct <= 2 || splitPct >= 98 ? ' is-edge' : ''
                }`}
                role="slider"
                tabIndex={0}
                aria-label="مقارنة قبل وبعد الترميم"
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
              <h2 className="section-title">من الطوب الخام إلى تسليم المفتاح.</h2>
              <p className="section-sub">
                اسحب المؤشر لمعاينة التحول الكامل في مشاريع الترميم: من بناء
                الجدران وتسوية الأرضيات إلى تركيب البورسلان، الجبس، والدهان
                المعماري.
              </p>

              <div
                className="segmented-control"
                role="tablist"
                aria-label="حالة المقارنة"
              >
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct >= 98 ? ' is-active' : ''}`}
                  aria-selected={splitPct >= 98}
                  onClick={() => updateSplit(100, true)}
                >
                  قبل الأشغال
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct <= 2 ? ' is-active' : ''}`}
                  aria-selected={splitPct <= 2}
                  onClick={() => updateSplit(0, true)}
                >
                  بعد التسليم
                </button>
              </div>

              <div className="thermal-metrics">
                <div className="metric-item">
                  <span className="metric-value tabular-nums">45 يوماً</span>
                  <span className="metric-label">متوسط مدة ترميم شقة</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value tabular-nums">1 ملم</span>
                  <span className="metric-label">دقة فواصل السيراميك</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Services Asymmetric Bento */}
        <section id="services" className="bento-section">
          <div className="container">
            <div className="section-header-stack">
              <h2 className="section-title">تخصصات البناء والسيراميك.</h2>
              <p className="section-sub">
                تنفيذ متقن لكل مراحل الورشة من التأسيس الهيكلي حتى أدق تفاصيل
                البلاط والتجهيز الداخلي.
              </p>
            </div>

            <div className="bento-grid" ref={bentoGridRef}>
              <article className="bento-tile bento-tall reveal-tile">
                <img
                  src={GENERATED_ASSETS.ceramicArtisan}
                  alt="تركيب ألواح السيراميك والبورسلان كبير المقاس"
                  className="bento-img"
                  referrerPolicy="no-referrer"
                />
                <div className="bento-footer">
                  <h3 className="bento-title">
                    01. تركيب السيراميك والبورسلان كبير المقاس
                  </h3>
                  <p className="bento-sub">
                    تثبيت الألواح باستخدام الغراء المرن C2TE ومشابك التسوية
                    الليزرية لأرضيات وجدران خالية من التفاوت.
                  </p>
                </div>
              </article>

              <article className="bento-tile bento-top reveal-tile">
                <img
                  src={GENERATED_ASSETS.kitchenMarble}
                  alt="تجهيز وتبليط المطابخ والحمامات الحديثة"
                  className="bento-img"
                  referrerPolicy="no-referrer"
                />
                <div className="bento-footer">
                  <h3 className="bento-title">
                    02. تجديد المطابخ والحمامات العصرية
                  </h3>
                  <p className="bento-sub">
                    عزل مائي محكم، سباكة حديثة، وتلبيس بألواح الكالاكاتا المقاومة
                    للرطوبة.
                  </p>
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
                    <h3 className="bento-title">
                      03. البناء الهيكلي والترميم الشامل
                    </h3>
                    <p className="bento-sub">
                      دراسة هندسية، بناء، تلبيس إسمنتي وجبسي، وواجهات حجرية
                    </p>
                  </div>
                  <span className="bento-spec-note">تسليم مفتاح</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* SECTION 5: Public Works & Photos Gallery */}
        <section id="gallery" className="gallery-section">
          <div className="container">
            <div className="gallery-header">
              <div>
                <h2 className="section-title">معرض الأعمال والصور للعامة</h2>
                <p className="section-sub">
                  تصفح جميع المشاريع المنفذة والمضافة حديثاً. اضغط على أي مشروع
                  لمعاينة الصور والتفاصيل الكاملة.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setEditingProject(null);
                  setDrawerOpen(true);
                }}
              >
                <Plus size={17} />
                <span>إضافة عمل وصور</span>
              </button>
            </div>

            <div className="gallery-toolbar">
              <div
                className="filter-tabs"
                role="tablist"
                aria-label="تصفية الأعمال حسب التخصص"
              >
                {(
                  Object.keys(CATEGORY_LABELS) as (ProjectCategory | 'all')[]
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === cat}
                    className={`filter-tab${
                      activeCategory === cat ? ' is-active' : ''
                    }`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              <div className="gallery-search-wrap">
                <Search size={16} className="gallery-search-icon" />
                <input
                  type="search"
                  className="gallery-search-input"
                  placeholder="ابحث بالولاية أو نوع العمل..."
                  aria-label="ابحث في المشاريع"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {projectsLoading && firestoreProjects.length === 0 ? (
              <div className="gallery-empty">
                <p>جاري تحميل المشاريع...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="gallery-empty">
                <p>لا توجد أعمال مطابقة للبحث الحالي.</p>
              </div>
            ) : (
              <div className="projects-grid">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className="project-card"
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="project-thumb-wrap">
                      <img
                        src={project.coverImage}
                        alt={project.title}
                        className="project-thumb-img"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="project-card-body">
                      <div className="project-meta-line">
                        <span>{CATEGORY_LABELS[project.category]}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.location}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{project.areaSqm}</span>
                      </div>
                      <h3 className="project-card-title">{project.title}</h3>
                      <p className="project-card-desc">{project.description}</p>
                      <div className="project-card-foot">
                        <span>{project.ownerName}</span>
                        <span className="project-view-cta">معاينة الصور</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span className="footer-brand">اخدم دارك dz darkom pro</span>
          <span>أعمال البناء والسيراميك وترميم المنازل</span>
          <div className="footer-actions">
            <button
              type="button"
              className="theme-switch-btn"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}</span>
            </button>
            <span>© 2026 dz darkom pro</span>
          </div>
        </div>
      </footer>

      <ProjectLightbox
        project={selectedProject}
        user={user}
        isAdmin={isAdmin}
        onClose={() => setSelectedProject(null)}
        onEdit={handleEditFromLightbox}
        onDelete={handleDeleteProject}
      />

      <ProjectManagerDrawer
        open={drawerOpen}
        user={user}
        authLoading={authLoading}
        isAdmin={isAdmin}
        editingProject={editingProject}
        userProjects={userProjects}
        onClose={() => setDrawerOpen(false)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onClearEdit={() => setEditingProject(null)}
        onEditProject={(proj) => setEditingProject(proj)}
        onDeleteProject={handleDeleteProject}
      />
    </>
  );
}
