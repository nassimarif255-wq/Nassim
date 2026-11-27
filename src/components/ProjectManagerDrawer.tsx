import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  ExternalLink,
  ImagePlus,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  ArtisanRecord,
  InquiryRecord,
  ProjectCategory,
  ProjectRecord,
  ServiceRequestRecord,
  TeamServiceGuideRecord,
  TeamSkillRecord,
} from '../data/showcaseDefaults';
import {
  AppLang,
  getCategoryLabel,
  SERVICE_CATEGORIES,
  ServiceCategoryId,
} from '../data/i18n';
import { ALGERIA_WILAYAS } from '../data/algeriaLocations';
import { MediaFolder, uploadMediaImage } from '../utils/mediaStorage';
import { AdminDashboardTab } from './AdminDashboardTab';

export type PortalTab = 'project' | 'artisan' | 'request' | 'messages' | 'admin';

interface ProjectManagerDrawerProps {
  open: boolean;
  initialTab: PortalTab;
  user: User | null;
  authLoading: boolean;
  isAdmin: boolean;
  lang: AppLang;
  editingProject: ProjectRecord | null;
  editingArtisan: ArtisanRecord | null;
  userProjects: ProjectRecord[];
  userArtisans: ArtisanRecord[];
  allArtisans: ArtisanRecord[];
  allRequests: ServiceRequestRecord[];
  firestoreSkills: TeamSkillRecord[];
  firestoreServices: TeamServiceGuideRecord[];
  onClose: () => void;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onClearEditProject: () => void;
  onClearEditArtisan: () => void;
  onEditProject: (project: ProjectRecord) => void;
  onDeleteProject: (project: ProjectRecord) => void;
  onEditArtisan: (artisan: ArtisanRecord) => void;
  onDeleteArtisan: (artisan: ArtisanRecord) => void;
  onOpenRequestDetail: (req: ServiceRequestRecord) => void;
  onDeleteRequest: (req: ServiceRequestRecord) => Promise<void>;
}

export function parseTagInput(raw: string): string[] {
  return raw
    .split(/[\n,،]+/)
    .map((s) => s.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 12);
}

export function ProjectManagerDrawer({
  open,
  initialTab,
  user,
  authLoading,
  isAdmin,
  lang,
  editingProject,
  editingArtisan,
  userProjects,
  userArtisans,
  allArtisans,
  allRequests,
  firestoreSkills,
  firestoreServices,
  onClose,
  onSignIn,
  onSignOut,
  onClearEditProject,
  onClearEditArtisan,
  onEditProject,
  onDeleteProject,
  onEditArtisan,
  onDeleteArtisan,
  onOpenRequestDetail,
  onDeleteRequest,
}: ProjectManagerDrawerProps) {
  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);

  // Project form state (Admin Only)
  const [projTitle, setProjTitle] = useState('');
  const [projCategory, setProjCategory] =
    useState<ProjectCategory>('ceramics');
  const [projLocation, setProjLocation] = useState('');
  const [projArea, setProjArea] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projCover, setProjCover] = useState('');
  const [projBefore, setProjBefore] = useState('');
  const [projServicesRaw, setProjServicesRaw] = useState('');
  const [projSpecialtiesRaw, setProjSpecialtiesRaw] = useState('');
  const [projArtisanId, setProjArtisanId] = useState('');
  const [projExtras, setProjExtras] = useState<
    { imageUrl: string; caption: string }[]
  >([]);
  const [urlInput, setUrlInput] = useState('');

  // Artisan / Team member profile form state (Admin Only)
  const [artName, setArtName] = useState('');
  const [artRoleTitle, setArtRoleTitle] = useState('');
  const [artProf, setArtProf] = useState<ServiceCategoryId>('ceramics');
  const [artExp, setArtExp] = useState('5');
  const [artWilaya, setArtWilaya] = useState('الجزائر العاصمة');
  const [artCommune, setArtCommune] = useState('حيدرة');
  const [artBio, setArtBio] = useState('');
  const [artSkillsRaw, setArtSkillsRaw] = useState('');
  const [artToolsRaw, setArtToolsRaw] = useState('');
  const [artAvatar, setArtAvatar] = useState('');
  const [artPhotos, setArtPhotos] = useState<
    { imageUrl: string; caption: string }[]
  >([]);

  // Customer request form state (Verified Client / Admin)
  const [reqTitle, setReqTitle] = useState('');
  const [reqCategory, setReqCategory] =
    useState<ServiceCategoryId>('construction_renovation');
  const [reqWilaya, setReqWilaya] = useState('الجزائر العاصمة');
  const [reqCommune, setReqCommune] = useState('حيدرة');
  const [reqDesc, setReqDesc] = useState('');
  const [reqCover, setReqCover] = useState('');
  const [reqExtras, setReqExtras] = useState<
    { imageUrl: string; caption: string }[]
  >([]);

  // Inquiries state
  const [incomingInquiries, setIncomingInquiries] = useState<InquiryRecord[]>(
    []
  );
  const [sentInquiries, setSentInquiries] = useState<InquiryRecord[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Shared UI status
  const [submitting, setSubmitting] = useState(false);
  const [processingImg, setProcessingImg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (open) {
      const allowedTab: PortalTab = isAdmin
        ? initialTab
        : initialTab === 'messages'
          ? 'messages'
          : 'request';
      setActiveTab(allowedTab);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [open, initialTab, isAdmin]);

  useEffect(() => {
    if (editingProject && isAdmin) {
      setActiveTab('project');
      setProjTitle(editingProject.title);
      setProjCategory(editingProject.category);
      setProjLocation(editingProject.location);
      setProjArea(editingProject.areaSqm);
      setProjDesc(editingProject.description);
      setProjCover(editingProject.coverImage);
      setProjBefore(editingProject.beforeImage || '');
      setProjServicesRaw((editingProject.completedServices || []).join('، '));
      setProjSpecialtiesRaw((editingProject.specialties || []).join('، '));
      setProjArtisanId(editingProject.artisanId || '');
      setProjExtras([]);
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      setProjTitle('');
      setProjCategory('ceramics');
      setProjLocation('');
      setProjArea('');
      setProjDesc('');
      setProjCover('');
      setProjBefore('');
      setProjServicesRaw('');
      setProjSpecialtiesRaw('');
      setProjArtisanId('');
      setProjExtras([]);
      setUrlInput('');
    }
  }, [editingProject, isAdmin]);

  useEffect(() => {
    if (editingArtisan && isAdmin) {
      setActiveTab('artisan');
      setArtName(editingArtisan.displayName);
      setArtRoleTitle(editingArtisan.roleTitle || '');
      setArtProf(editingArtisan.profession);
      setArtExp(String(editingArtisan.experienceYears));
      setArtWilaya(editingArtisan.wilaya);
      setArtCommune(editingArtisan.commune);
      setArtBio(editingArtisan.bio);
      setArtSkillsRaw((editingArtisan.skillsList || []).join('، '));
      setArtToolsRaw((editingArtisan.toolsList || []).join('، '));
      setArtAvatar(editingArtisan.avatarUrl);
      setArtPhotos([]);
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      setArtName('');
      setArtRoleTitle('');
      setArtProf('ceramics');
      setArtExp('5');
      setArtWilaya('الجزائر العاصمة');
      setArtCommune('حيدرة');
      setArtBio('');
      setArtSkillsRaw('');
      setArtToolsRaw('');
      setArtAvatar('');
      setArtPhotos([]);
    }
  }, [editingArtisan, isAdmin]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!user || !user.emailVerified) {
      setIncomingInquiries([]);
      setSentInquiries([]);
      return;
    }

    if (isAdmin) {
      const qAll = query(collection(db, 'inquiries'));
      const unsubAll = onSnapshot(
        qAll,
        (snap) => {
          const all: InquiryRecord[] = snap.docs.map((d) => {
            const data = d.data();
            const ts = data.createdAt?.toMillis ? data.createdAt.toMillis() : 0;
            return {
              id: d.id,
              senderId: String(data.senderId || ''),
              senderName: String(data.senderName || ''),
              recipientOwnerId: String(data.recipientOwnerId || ''),
              recipientName: String(data.recipientName || ''),
              contextType:
                (data.contextType as 'team' | 'artisan' | 'request') || 'team',
              contextId: String(data.contextId || ''),
              contextTitle: String(data.contextTitle || ''),
              message: String(data.message || ''),
              contactInfo: String(data.contactInfo || ''),
              replyText: String(data.replyText || ''),
              status: (data.status as 'pending' | 'replied') || 'pending',
              createdAtMs: ts,
            };
          });
          all.sort((a, b) => b.createdAtMs - a.createdAtMs);
          setIncomingInquiries(all.filter((i) => i.senderId !== user.uid));
          setSentInquiries(all.filter((i) => i.senderId === user.uid));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'inquiries')
      );
      return () => unsubAll();
    }

    const qIn = query(
      collection(db, 'inquiries'),
      where('recipientOwnerId', '==', user.uid)
    );
    const unsubIn = onSnapshot(
      qIn,
      (snap) => {
        const list: InquiryRecord[] = snap.docs.map((d) => {
          const data = d.data();
          const ts = data.createdAt?.toMillis ? data.createdAt.toMillis() : 0;
          return {
            id: d.id,
            senderId: String(data.senderId || ''),
            senderName: String(data.senderName || ''),
            recipientOwnerId: String(data.recipientOwnerId || ''),
            recipientName: String(data.recipientName || ''),
            contextType:
              (data.contextType as 'team' | 'artisan' | 'request') || 'team',
            contextId: String(data.contextId || ''),
            contextTitle: String(data.contextTitle || ''),
            message: String(data.message || ''),
            contactInfo: String(data.contactInfo || ''),
            replyText: String(data.replyText || ''),
            status: (data.status as 'pending' | 'replied') || 'pending',
            createdAtMs: ts,
          };
        });
        list.sort((a, b) => b.createdAtMs - a.createdAtMs);
        setIncomingInquiries(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'inquiries')
    );

    const qSent = query(
      collection(db, 'inquiries'),
      where('senderId', '==', user.uid)
    );
    const unsubSent = onSnapshot(
      qSent,
      (snap) => {
        const list: InquiryRecord[] = snap.docs.map((d) => {
          const data = d.data();
          const ts = data.createdAt?.toMillis ? data.createdAt.toMillis() : 0;
          return {
            id: d.id,
            senderId: String(data.senderId || ''),
            senderName: String(data.senderName || ''),
            recipientOwnerId: String(data.recipientOwnerId || ''),
            recipientName: String(data.recipientName || ''),
            contextType:
              (data.contextType as 'team' | 'artisan' | 'request') || 'team',
            contextId: String(data.contextId || ''),
            contextTitle: String(data.contextTitle || ''),
            message: String(data.message || ''),
            contactInfo: String(data.contactInfo || ''),
            replyText: String(data.replyText || ''),
            status: (data.status as 'pending' | 'replied') || 'pending',
            createdAtMs: ts,
          };
        });
        list.sort((a, b) => b.createdAtMs - a.createdAtMs);
        setSentInquiries(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'inquiries')
    );

    return () => {
      unsubIn();
      unsubSent();
    };
  }, [user, isAdmin]);

  const artCommunes = useMemo(() => {
    const w = ALGERIA_WILAYAS.find((item) => item.ar === artWilaya);
    return w ? w.communes : [];
  }, [artWilaya]);

  const reqCommunes = useMemo(() => {
    const w = ALGERIA_WILAYAS.find((item) => item.ar === reqWilaya);
    return w ? w.communes : [];
  }, [reqWilaya]);

  const processSingleFile = async (
    file: File,
    folder: MediaFolder,
    onDone: (uri: string) => void
  ) => {
    if (!user) return;
    setErrorMsg('');
    setProcessingImg(true);
    try {
      const uri = await uploadMediaImage(file, folder, user.uid);
      onDone(uri);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'تعذر معالجة الصورة.'
      );
    } finally {
      setProcessingImg(false);
    }
  };

  const processBatchFiles = async (
    files: File[],
    folder: MediaFolder,
    currentCount: number,
    maxCount: number,
    onDone: (items: { imageUrl: string; caption: string }[]) => void
  ) => {
    if (!user) return;
    const remaining = maxCount - currentCount;
    if (remaining <= 0) {
      setErrorMsg(
        lang === 'ar'
          ? `الحد الأقصى هو ${maxCount} صور إضافية.`
          : `Maximum ${maxCount} photos supplémentaires.`
      );
      return;
    }
    setErrorMsg('');
    setProcessingImg(true);
    try {
      const processed: { imageUrl: string; caption: string }[] = [];
      for (const f of files.slice(0, remaining)) {
        const uri = await uploadMediaImage(f, folder, user.uid);
        processed.push({
          imageUrl: uri,
          caption: f.name.replace(/\.[^/.]+$/, '').slice(0, 120),
        });
      }
      onDone(processed);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'تعذر رفع إحدى الصور.'
      );
    } finally {
      setProcessingImg(false);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.emailVerified || !isAdmin) return;

    const cleanTitle = projTitle.trim();
    const cleanLoc = projLocation.trim();
    const cleanArea = projArea.trim();
    const cleanDesc = projDesc.trim();
    const completedServices = parseTagInput(projServicesRaw);
    const specialties = parseTagInput(projSpecialtiesRaw);

    if (
      cleanTitle.length < 3 ||
      cleanLoc.length < 2 ||
      cleanArea.length < 1 ||
      cleanDesc.length < 5 ||
      !projCover
    ) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى ملء جميع الحقول وإرفاق الصورة الرئيسية (بعد الأشغال).'
          : 'Veuillez remplir tous les champs et ajouter la photo finale.'
      );
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      if (editingProject) {
        const path = `projects/${editingProject.id}`;
        await updateDoc(doc(db, 'projects', editingProject.id), {
          title: cleanTitle.slice(0, 120),
          category: projCategory,
          location: cleanLoc.slice(0, 80),
          areaSqm: cleanArea.slice(0, 30),
          description: cleanDesc.slice(0, 1500),
          coverImage: projCover,
          beforeImage: projBefore,
          completedServices,
          specialties,
          artisanId: projArtisanId,
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, path)
        );
        setSuccessMsg(
          lang === 'ar'
            ? 'تم تحديث العمل بنجاح.'
            : 'Réalisation mise à jour.'
        );
        onClearEditProject();
      } else {
        const projectId = `proj_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 7)}`;
        const path = `projects/${projectId}`;
        await setDoc(doc(db, 'projects', projectId), {
          title: cleanTitle.slice(0, 120),
          category: projCategory,
          location: cleanLoc.slice(0, 80),
          areaSqm: cleanArea.slice(0, 30),
          description: cleanDesc.slice(0, 1500),
          coverImage: projCover,
          beforeImage: projBefore,
          completedServices,
          specialties,
          artisanId: projArtisanId,
          ownerId: user.uid,
          ownerName: (user.displayName || 'فريق اخدم دارك').slice(0, 100),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, path)
        );

        for (let i = 0; i < projExtras.length; i++) {
          const photoId = `photo_${Date.now()}_${i}`;
          await setDoc(doc(db, 'projects', projectId, 'photos', photoId), {
            imageUrl: projExtras[i].imageUrl,
            caption: projExtras[i].caption.slice(0, 200),
            ownerId: user.uid,
            createdAt: serverTimestamp(),
          }).catch((err) =>
            handleFirestoreError(
              err,
              OperationType.CREATE,
              `projects/${projectId}/photos/${photoId}`
            )
          );
        }

        setProjTitle('');
        setProjLocation('');
        setProjArea('');
        setProjDesc('');
        setProjCover('');
        setProjBefore('');
        setProjServicesRaw('');
        setProjSpecialtiesRaw('');
        setProjArtisanId('');
        setProjExtras([]);
        setSuccessMsg(
          lang === 'ar'
            ? 'تم نشر المشروع الحقيقي والصور في المعرض العام.'
            : 'Projet réel publié dans la galerie.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleArtisanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.emailVerified || !isAdmin) return;

    const cleanName = artName.trim();
    const cleanWilaya = artWilaya.trim();
    const cleanCommune = artCommune.trim();
    const cleanBio = artBio.trim();
    const expNum = Math.max(0, Math.min(80, Number(artExp) || 0));
    const skillsList = parseTagInput(artSkillsRaw);
    const toolsList = parseTagInput(artToolsRaw);

    if (
      cleanName.length < 2 ||
      cleanWilaya.length < 2 ||
      cleanCommune.length < 2 ||
      cleanBio.length < 10
    ) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال الاسم، الولاية، البلدية، ونبذة خبرة (10 أحرف على الأقل).'
          : 'Veuillez renseigner le nom, la wilaya, la commune et une bio (min 10 caractères).'
      );
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      if (editingArtisan) {
        const path = `artisans/${editingArtisan.id}`;
        await updateDoc(doc(db, 'artisans', editingArtisan.id), {
          displayName: cleanName.slice(0, 100),
          roleTitle: artRoleTitle.trim().slice(0, 100),
          profession: artProf,
          experienceYears: expNum,
          wilaya: cleanWilaya.slice(0, 60),
          commune: cleanCommune.slice(0, 60),
          bio: cleanBio.slice(0, 1200),
          skillsList,
          toolsList,
          avatarUrl: artAvatar,
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, path)
        );
        setSuccessMsg(
          lang === 'ar'
            ? 'تم تحديث ملف العضو بنجاح.'
            : 'Profil membre mis à jour.'
        );
        onClearEditArtisan();
      } else {
        const artisanId = `art_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 7)}`;
        const path = `artisans/${artisanId}`;
        await setDoc(doc(db, 'artisans', artisanId), {
          displayName: cleanName.slice(0, 100),
          roleTitle: artRoleTitle.trim().slice(0, 100),
          profession: artProf,
          experienceYears: expNum,
          wilaya: cleanWilaya.slice(0, 60),
          commune: cleanCommune.slice(0, 60),
          bio: cleanBio.slice(0, 1200),
          skillsList,
          toolsList,
          avatarUrl: artAvatar,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, path)
        );

        for (let i = 0; i < artPhotos.length; i++) {
          const photoId = `artp_${Date.now()}_${i}`;
          await setDoc(doc(db, 'artisans', artisanId, 'photos', photoId), {
            imageUrl: artPhotos[i].imageUrl,
            caption: artPhotos[i].caption.slice(0, 200),
            ownerId: user.uid,
            createdAt: serverTimestamp(),
          }).catch((err) =>
            handleFirestoreError(
              err,
              OperationType.CREATE,
              `artisans/${artisanId}/photos/${photoId}`
            )
          );
        }

        setArtName('');
        setArtBio('');
        setArtRoleTitle('');
        setArtSkillsRaw('');
        setArtToolsRaw('');
        setArtAvatar('');
        setArtPhotos([]);
        setSuccessMsg(
          lang === 'ar'
            ? 'تم نشر ملف عضو الفريق بنجاح.'
            : 'Profil membre publié.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.emailVerified) return;

    const cleanTitle = reqTitle.trim();
    const cleanWilaya = reqWilaya.trim();
    const cleanCommune = reqCommune.trim();
    const cleanDesc = reqDesc.trim();

    if (
      cleanTitle.length < 3 ||
      cleanWilaya.length < 2 ||
      cleanCommune.length < 2 ||
      cleanDesc.length < 10
    ) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال عنوان الطلب، المنطقة، ووصف المشكلة (10 أحرف على الأقل).'
          : 'Veuillez renseigner le titre, la zone et la description (min 10 caractères).'
      );
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const reqId = `req_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const path = `requests/${reqId}`;
      await setDoc(doc(db, 'requests', reqId), {
        title: cleanTitle.slice(0, 120),
        category: reqCategory,
        wilaya: cleanWilaya.slice(0, 60),
        commune: cleanCommune.slice(0, 60),
        description: cleanDesc.slice(0, 1500),
        coverImage: reqCover,
        status: 'open',
        adminNote: '',
        ownerId: user.uid,
        ownerName: (user.displayName || 'زبون').slice(0, 100),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, path)
      );

      for (let i = 0; i < reqExtras.length; i++) {
        const photoId = `reqp_${Date.now()}_${i}`;
        await setDoc(doc(db, 'requests', reqId, 'photos', photoId), {
          imageUrl: reqExtras[i].imageUrl,
          caption: reqExtras[i].caption.slice(0, 200),
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(
            err,
            OperationType.CREATE,
            `requests/${reqId}/photos/${photoId}`
          )
        );
      }

      setReqTitle('');
      setReqDesc('');
      setReqCover('');
      setReqExtras([]);
      setSuccessMsg(
        lang === 'ar'
          ? 'تم إرسال طلبك لفريقنا بنجاح وستتم مراجعته والرد عليك.'
          : 'Demande transmise à notre équipe.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (inq: InquiryRecord) => {
    const text = (replyDrafts[inq.id] || '').trim();
    if (!text || !user) return;
    const path = `inquiries/${inq.id}`;
    await updateDoc(doc(db, 'inquiries', inq.id), {
      replyText: text.slice(0, 1000),
      status: 'replied',
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
    setReplyDrafts((prev) => ({ ...prev, [inq.id]: '' }));
  };

  const pendingInboxCount = incomingInquiries.filter(
    (i) => i.status === 'pending'
  ).length;

  return (
    <>
      <div className="drawer-backdrop" hidden={!open} onClick={onClose} />
      <aside
        className="bag-drawer workspace-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-drawer-title"
        hidden={!open}
      >
        <div className="drawer-header">
          <div>
            <h2 id="workspace-drawer-title" className="drawer-title">
              {isAdmin
                ? lang === 'ar'
                  ? 'لوحة إدارة DZ Darkom Pro'
                  : 'Administration DZ Darkom Pro'
                : lang === 'ar'
                  ? 'بوابة الزبائن والتواصل'
                  : 'Espace Client & Contact'}
            </h2>
            <p className="drawer-subtitle">اخدم دارك dz darkom pro</p>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label={lang === 'ar' ? 'إغلاق البوابة' : 'Fermer'}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {authLoading ? (
            <div className="drawer-empty">
              <p>
                {lang === 'ar'
                  ? 'جاري التحقق من الحساب...'
                  : 'Vérification de session...'}
              </p>
            </div>
          ) : !user ? (
            <div className="auth-gate">
              <h3>
                {lang === 'ar'
                  ? 'تسجيل دخول الزبائن والإدارة'
                  : 'Connexion Client / Admin'}
              </h3>
              <p>
                {lang === 'ar'
                  ? 'تصفح المهارات، شرح الخدمات، ملفات الفريق، ومعرض قبل وبعد متاح للجميع. سجّل الدخول لإرسال طلب معاينة لفريقنا أو متابعة رسائلك (ولإدارة الموقع لحساب المدير).'
                  : 'La consultation est publique. Connectez-vous avec Google pour envoyer une demande ou consulter vos messages (ou gérer le site pour l’Admin).'}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={onSignIn}
              >
                <LogIn size={18} />
                <span>
                  {lang === 'ar'
                    ? 'الدخول بحساب Google'
                    : 'Se connecter avec Google'}
                </span>
              </button>
            </div>
          ) : (
            <div className="workspace-content">
              <div className="user-bar">
                <div className="user-bar-info">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="user-avatar"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="user-avatar-fallback">
                      {(user.displayName || 'م').charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="user-name">
                      {user.displayName || 'مستخدم مسجل'}
                    </div>
                    <div className="user-meta">
                      {isAdmin
                        ? lang === 'ar'
                          ? 'مدير الفريق (صلاحية كاملة)'
                          : 'Admin (accès complet)'
                        : lang === 'ar'
                          ? 'حساب زبون مفعل'
                          : 'Compte client vérifié'}{' '}
                      · {user.email}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onSignOut}
                >
                  <LogOut size={14} />
                  <span>{lang === 'ar' ? 'خروج' : 'Quitter'}</span>
                </button>
              </div>

              <div
                className={`portal-tabs${isAdmin ? ' has-5' : ' has-2'}`}
                role="tablist"
              >
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'admin'}
                      className={`portal-tab${
                        activeTab === 'admin' ? ' is-active' : ''
                      }`}
                      onClick={() => {
                        setActiveTab('admin');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                    >
                      <ShieldCheck
                        size={13}
                        style={{ display: 'inline', marginInlineEnd: 4 }}
                      />
                      {lang === 'ar' ? 'الإدارة' : 'Admin'}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'project'}
                      className={`portal-tab${
                        activeTab === 'project' ? ' is-active' : ''
                      }`}
                      onClick={() => {
                        setActiveTab('project');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                    >
                      {lang === 'ar' ? 'المشاريع' : 'Projets'}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'artisan'}
                      className={`portal-tab${
                        activeTab === 'artisan' ? ' is-active' : ''
                      }`}
                      onClick={() => {
                        setActiveTab('artisan');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                    >
                      {lang === 'ar' ? 'الفريق' : 'Équipe'}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'request'}
                  className={`portal-tab${
                    activeTab === 'request' ? ' is-active' : ''
                  }`}
                  onClick={() => {
                    setActiveTab('request');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                >
                  {lang === 'ar' ? 'طلب خدمة' : 'Demande'}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'messages'}
                  className={`portal-tab${
                    activeTab === 'messages' ? ' is-active' : ''
                  }`}
                  onClick={() => {
                    setActiveTab('messages');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                >
                  {lang === 'ar'
                    ? `الرسائل (${pendingInboxCount})`
                    : `Messages (${pendingInboxCount})`}
                </button>
              </div>

              {activeTab === 'admin' && isAdmin && (
                <AdminDashboardTab
                  user={user}
                  lang={lang}
                  firestoreSkills={firestoreSkills}
                  firestoreServices={firestoreServices}
                  artisans={allArtisans}
                  requests={allRequests}
                  onGoToArtisansTab={() => setActiveTab('artisan')}
                  onGoToProjectsTab={() => setActiveTab('project')}
                  onOpenRequestDetail={onOpenRequestDetail}
                  onDeleteRequest={onDeleteRequest}
                />
              )}

              {activeTab === 'project' && isAdmin && (
                <>
                  <form className="project-form" onSubmit={handleProjectSubmit}>
                    <div className="form-header-row">
                      <h3 className="form-heading">
                        {editingProject
                          ? lang === 'ar'
                            ? 'تعديل المشروع'
                            : 'Modifier le projet'
                          : lang === 'ar'
                            ? 'إضافة مشروع حقيقي وصور قبل/بعد'
                            : 'Ajouter un chantier réel Avant/Après'}
                      </h3>
                      {editingProject && (
                        <button
                          type="button"
                          className="text-link-btn"
                          onClick={onClearEditProject}
                        >
                          {lang === 'ar' ? 'إلغاء التعديل' : 'Annuler'}
                        </button>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="proj-title">
                        {lang === 'ar' ? 'عنوان المشروع' : 'Titre du chantier'}
                      </label>
                      <input
                        id="proj-title"
                        type="text"
                        className="form-input"
                        maxLength={120}
                        required
                        value={projTitle}
                        onChange={(e) => setProjTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label className="form-label" htmlFor="proj-cat">
                          {lang === 'ar' ? 'التخصص الرئيسي' : 'Spécialité'}
                        </label>
                        <select
                          id="proj-cat"
                          className="form-input"
                          value={projCategory}
                          onChange={(e) =>
                            setProjCategory(e.target.value as ProjectCategory)
                          }
                        >
                          {SERVICE_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {lang === 'ar' ? c.ar : c.fr}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="form-label" htmlFor="proj-area">
                          {lang === 'ar' ? 'المساحة / الحجم' : 'Surface'}
                        </label>
                        <input
                          id="proj-area"
                          type="text"
                          className="form-input"
                          placeholder="160 م²"
                          maxLength={30}
                          required
                          value={projArea}
                          onChange={(e) => setProjArea(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label className="form-label" htmlFor="proj-loc">
                          {lang === 'ar' ? 'الولاية والبلدية' : 'Wilaya & Commune'}
                        </label>
                        <input
                          id="proj-loc"
                          type="text"
                          className="form-input"
                          placeholder={
                            lang === 'ar'
                              ? 'حيدرة، الجزائر العاصمة'
                              : 'Hydra, Alger'
                          }
                          maxLength={80}
                          required
                          value={projLocation}
                          onChange={(e) => setProjLocation(e.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label" htmlFor="proj-artisan">
                          {lang === 'ar'
                            ? 'عضو الفريق المنفذ (اختياري)'
                            : 'Membre responsable'}
                        </label>
                        <select
                          id="proj-artisan"
                          className="form-input"
                          value={projArtisanId}
                          onChange={(e) => setProjArtisanId(e.target.value)}
                        >
                          <option value="">
                            {lang === 'ar'
                              ? 'فريق اخدم دارك'
                              : 'Équipe DZ Darkom'}
                          </option>
                          {allArtisans.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="proj-specs">
                        {lang === 'ar'
                          ? 'التخصصات المشاركة (افصل بفاصلة ، - اختياري)'
                          : 'Lots impliqués (séparés par virgule - opt.)'}
                      </label>
                      <input
                        id="proj-specs"
                        type="text"
                        className="form-input"
                        placeholder={
                          lang === 'ar'
                            ? 'سيراميك، سباكة، كهرباء'
                            : 'Carrelage, plomberie, électricité'
                        }
                        value={projSpecialtiesRaw}
                        onChange={(e) => setProjSpecialtiesRaw(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="proj-services">
                        {lang === 'ar'
                          ? 'الخدمات والأشغال المنجزة (افصل بفاصلة ،)'
                          : 'Prestations réalisées (séparées par virgule)'}
                      </label>
                      <input
                        id="proj-services"
                        type="text"
                        className="form-input"
                        placeholder={
                          lang === 'ar'
                            ? 'تبليط بورسلان، عزل مائي، إنارة مخفية'
                            : 'Carrelage, étanchéité, éclairage LED'
                        }
                        value={projServicesRaw}
                        onChange={(e) => setProjServicesRaw(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="proj-desc">
                        {lang === 'ar' ? 'وصف الأشغال' : 'Description des travaux'}
                      </label>
                      <textarea
                        id="proj-desc"
                        className="form-input form-textarea"
                        rows={3}
                        maxLength={1500}
                        required
                        value={projDesc}
                        onChange={(e) => setProjDesc(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <span className="form-label">
                        {lang === 'ar'
                          ? 'الصورة الرئيسية (بعد الأشغال)'
                          : 'Photo principale (Après travaux)'}
                      </span>
                      <div className="upload-box">
                        <label className="btn btn-ghost btn-sm upload-label">
                          <Upload size={15} />
                          <span>
                            {processingImg
                              ? lang === 'ar'
                                ? 'جاري الرفع...'
                                : 'Envoi...'
                              : lang === 'ar'
                                ? 'اختيار صورة من الجهاز'
                                : 'Importer une image'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            disabled={processingImg}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = '';
                              if (f)
                                void processSingleFile(
                                  f,
                                  'projects',
                                  setProjCover
                                );
                            }}
                          />
                        </label>
                        <div className="url-inline">
                          <input
                            type="url"
                            className="form-input"
                            placeholder="https://..."
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              const t = urlInput.trim();
                              if (t.startsWith('https://')) {
                                setProjCover(t);
                                setUrlInput('');
                              } else {
                                setErrorMsg('https:// required');
                              }
                            }}
                          >
                            {lang === 'ar' ? 'اعتماد' : 'OK'}
                          </button>
                        </div>
                      </div>
                      {projCover && (
                        <div className="cover-preview">
                          <img src={projCover} alt="Preview After" />
                          <button
                            type="button"
                            className="cover-remove"
                            onClick={() => setProjCover('')}
                          >
                            {lang === 'ar' ? 'إزالة' : 'Retirer'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="form-field">
                      <span className="form-label">
                        {lang === 'ar'
                          ? 'صورة قبل الأشغال (للمقارنة التفاعلية - اختياري)'
                          : 'Photo Avant travaux (optionnel)'}
                      </span>
                      <label className="btn btn-ghost btn-sm upload-label">
                        <Upload size={15} />
                        <span>
                          {lang === 'ar'
                            ? 'رفع صورة قبل الأشغال'
                            : 'Importer photo Avant'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          disabled={processingImg}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f)
                              void processSingleFile(
                                f,
                                'projects',
                                setProjBefore
                              );
                          }}
                        />
                      </label>
                      {projBefore && (
                        <div className="cover-preview">
                          <img src={projBefore} alt="Preview Before" />
                          <button
                            type="button"
                            className="cover-remove"
                            onClick={() => setProjBefore('')}
                          >
                            {lang === 'ar' ? 'إزالة' : 'Retirer'}
                          </button>
                        </div>
                      )}
                    </div>

                    {!editingProject && (
                      <div className="form-field">
                        <label className="btn btn-ghost btn-sm upload-label">
                          <ImagePlus size={15} />
                          <span>
                            {lang === 'ar'
                              ? `صور إضافية (${projExtras.length}/4)`
                              : `Photos supplémentaires (${projExtras.length}/4)`}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            disabled={processingImg || projExtras.length >= 4}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              e.target.value = '';
                              if (files.length)
                                void processBatchFiles(
                                  files,
                                  'projects',
                                  projExtras.length,
                                  4,
                                  (items) =>
                                    setProjExtras((prev) => [...prev, ...items])
                                );
                            }}
                          />
                        </label>
                        {projExtras.length > 0 && (
                          <div className="extra-preview-grid">
                            {projExtras.map((img, i) => (
                              <div key={i} className="extra-preview-item">
                                <img src={img.imageUrl} alt={img.caption} />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProjExtras((p) =>
                                      p.filter((_, idx) => idx !== i)
                                    )
                                  }
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {errorMsg && <p className="form-error">{errorMsg}</p>}
                    {successMsg && <p className="form-success">{successMsg}</p>}

                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={submitting || processingImg}
                    >
                      <Plus size={17} />
                      <span>
                        {submitting
                          ? lang === 'ar'
                            ? 'جاري الحفظ...'
                            : 'Enregistrement...'
                          : editingProject
                            ? lang === 'ar'
                              ? 'حفظ التعديلات'
                              : 'Enregistrer'
                            : lang === 'ar'
                              ? 'نشر المشروع في المعرض'
                              : 'Publier le projet'}
                      </span>
                    </button>
                  </form>

                  {userProjects.length > 0 && (
                    <div className="user-projects-list">
                      <h3 className="form-heading">
                        {lang === 'ar'
                          ? `المشاريع المنشورة (${userProjects.length})`
                          : `Projets publiés (${userProjects.length})`}
                      </h3>
                      {userProjects.map((proj) => (
                        <div key={proj.id} className="user-proj-row">
                          <img
                            src={proj.coverImage}
                            alt={proj.title}
                            className="user-proj-thumb"
                          />
                          <div className="user-proj-info">
                            <div className="user-proj-title">{proj.title}</div>
                            <div className="user-proj-meta">
                              {proj.location} · {proj.areaSqm}
                            </div>
                          </div>
                          <div className="user-proj-actions">
                            <button
                              type="button"
                              className="icon-btn-xs"
                              onClick={() => onEditProject(proj)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn-xs danger"
                              onClick={() => onDeleteProject(proj)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'artisan' && isAdmin && (
                <>
                  <form className="project-form" onSubmit={handleArtisanSubmit}>
                    <div className="form-header-row">
                      <h3 className="form-heading">
                        {editingArtisan
                          ? lang === 'ar'
                            ? 'تعديل ملف عضو الفريق'
                            : 'Modifier le profil membre'
                          : lang === 'ar'
                            ? 'إضافة عضو / حرفي إلى الفريق'
                            : 'Ajouter un artisan de l’équipe'}
                      </h3>
                      {editingArtisan && (
                        <button
                          type="button"
                          className="text-link-btn"
                          onClick={onClearEditArtisan}
                        >
                          {lang === 'ar' ? 'إلغاء' : 'Annuler'}
                        </button>
                      )}
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label className="form-label" htmlFor="art-name">
                          {lang === 'ar' ? 'اسم العضو / الحرفي' : 'Nom du membre'}
                        </label>
                        <input
                          id="art-name"
                          type="text"
                          className="form-input"
                          maxLength={100}
                          required
                          value={artName}
                          onChange={(e) => setArtName(e.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label" htmlFor="art-role">
                          {lang === 'ar'
                            ? 'الصفة / الدور في الفريق'
                            : 'Rôle dans l’équipe'}
                        </label>
                        <input
                          id="art-role"
                          type="text"
                          className="form-input"
                          placeholder={
                            lang === 'ar'
                              ? 'مثال: رئيس ورشة السيراميك'
                              : 'Ex : Chef d’équipe carrelage'
                          }
                          maxLength={100}
                          value={artRoleTitle}
                          onChange={(e) => setArtRoleTitle(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label className="form-label" htmlFor="art-prof">
                          {lang === 'ar' ? 'التخصص المهني' : 'Spécialité'}
                        </label>
                        <select
                          id="art-prof"
                          className="form-input"
                          value={artProf}
                          onChange={(e) =>
                            setArtProf(e.target.value as ServiceCategoryId)
                          }
                        >
                          {SERVICE_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {lang === 'ar' ? c.ar : c.fr}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="form-label" htmlFor="art-exp">
                          {lang === 'ar' ? 'سنوات الخبرة' : 'Années d’exp.'}
                        </label>
                        <input
                          id="art-exp"
                          type="number"
                          min={0}
                          max={80}
                          className="form-input"
                          required
                          value={artExp}
                          onChange={(e) => setArtExp(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label className="form-label" htmlFor="art-wilaya">
                          {lang === 'ar' ? 'الولاية' : 'Wilaya'}
                        </label>
                        <select
                          id="art-wilaya"
                          className="form-input"
                          value={artWilaya}
                          onChange={(e) => {
                            const wName = e.target.value;
                            setArtWilaya(wName);
                            const found = ALGERIA_WILAYAS.find(
                              (w) => w.ar === wName
                            );
                            if (found && found.communes[0]) {
                              setArtCommune(found.communes[0]);
                            }
                          }}
                        >
                          {ALGERIA_WILAYAS.map((w) => (
                            <option key={w.code} value={w.ar}>
                              {w.code} - {lang === 'ar' ? w.ar : w.fr}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="form-label" htmlFor="art-commune">
                          {lang === 'ar' ? 'البلدية' : 'Commune'}
                        </label>
                        <input
                          id="art-commune"
                          type="text"
                          list="art-communes-list"
                          className="form-input"
                          maxLength={60}
                          required
                          value={artCommune}
                          onChange={(e) => setArtCommune(e.target.value)}
                        />
                        <datalist id="art-communes-list">
                          {artCommunes.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="art-skills">
                        {lang === 'ar'
                          ? 'المهارات المتقنة (افصل بفاصلة ،)'
                          : 'Compétences maîtrisées (séparées par virgule)'}
                      </label>
                      <input
                        id="art-skills"
                        type="text"
                        className="form-input"
                        placeholder={
                          lang === 'ar'
                            ? 'بورسلان كبير المقاس، لحام TIG، عزل مائي'
                            : 'Grès cérame, soudure TIG, étanchéité'
                        }
                        value={artSkillsRaw}
                        onChange={(e) => setArtSkillsRaw(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="art-tools">
                        {lang === 'ar'
                          ? 'الأدوات والتجهيزات المستعملة (افصل بفاصلة ،)'
                          : 'Outillage utilisé (séparé par virgule)'}
                      </label>
                      <input
                        id="art-tools"
                        type="text"
                        className="form-input"
                        placeholder={
                          lang === 'ar'
                            ? 'ميزان ليزر، قاطع مائي، مكبس هيدروليكي'
                            : 'Niveau laser, coupe à eau, sertisseuse'
                        }
                        value={artToolsRaw}
                        onChange={(e) => setArtToolsRaw(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="art-bio">
                        {lang === 'ar'
                          ? 'نبذة عن الخبرة والأعمال'
                          : 'Présentation et parcours'}
                      </label>
                      <textarea
                        id="art-bio"
                        className="form-input form-textarea"
                        rows={3}
                        maxLength={1200}
                        required
                        value={artBio}
                        onChange={(e) => setArtBio(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="btn btn-ghost btn-sm upload-label">
                        <Upload size={15} />
                        <span>
                          {lang === 'ar'
                            ? 'صورة العضو'
                            : 'Photo du membre'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          disabled={processingImg}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f)
                              void processSingleFile(
                                f,
                                'artisans',
                                setArtAvatar
                              );
                          }}
                        />
                      </label>
                      {artAvatar && (
                        <div className="cover-preview">
                          <img src={artAvatar} alt="Avatar" />
                          <button
                            type="button"
                            className="cover-remove"
                            onClick={() => setArtAvatar('')}
                          >
                            {lang === 'ar' ? 'إزالة' : 'Retirer'}
                          </button>
                        </div>
                      )}
                    </div>

                    {!editingArtisan && (
                      <div className="form-field">
                        <label className="btn btn-ghost btn-sm upload-label">
                          <ImagePlus size={15} />
                          <span>
                            {lang === 'ar'
                              ? `صور أعمال سابقة (${artPhotos.length}/4)`
                              : `Photos de chantiers (${artPhotos.length}/4)`}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            disabled={processingImg || artPhotos.length >= 4}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              e.target.value = '';
                              if (files.length)
                                void processBatchFiles(
                                  files,
                                  'artisans',
                                  artPhotos.length,
                                  4,
                                  (items) =>
                                    setArtPhotos((prev) => [...prev, ...items])
                                );
                            }}
                          />
                        </label>
                        {artPhotos.length > 0 && (
                          <div className="extra-preview-grid">
                            {artPhotos.map((img, i) => (
                              <div key={i} className="extra-preview-item">
                                <img src={img.imageUrl} alt={img.caption} />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setArtPhotos((p) =>
                                      p.filter((_, idx) => idx !== i)
                                    )
                                  }
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {errorMsg && <p className="form-error">{errorMsg}</p>}
                    {successMsg && <p className="form-success">{successMsg}</p>}

                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={submitting || processingImg}
                    >
                      <Plus size={17} />
                      <span>
                        {submitting
                          ? lang === 'ar'
                            ? 'جاري الحفظ...'
                            : 'Enregistrement...'
                          : editingArtisan
                            ? lang === 'ar'
                              ? 'حفظ تعديلات العضو'
                              : 'Mettre à jour le profil'
                            : lang === 'ar'
                              ? 'نشر ملف العضو'
                              : 'Publier le membre'}
                      </span>
                    </button>
                  </form>

                  {userArtisans.length > 0 && (
                    <div className="user-projects-list">
                      <h3 className="form-heading">
                        {lang === 'ar' ? 'ملفات الفريق' : 'Membres de l’équipe'}
                      </h3>
                      {userArtisans.map((art) => (
                        <div key={art.id} className="user-proj-row">
                          <div className="user-proj-info">
                            <div className="user-proj-title">
                              {art.displayName}
                            </div>
                            <div className="user-proj-meta">
                              {art.wilaya} - {art.commune}
                            </div>
                          </div>
                          <div className="user-proj-actions">
                            <button
                              type="button"
                              className="icon-btn-xs"
                              onClick={() => onEditArtisan(art)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn-xs danger"
                              onClick={() => onDeleteArtisan(art)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'request' && (
                <>
                  <form className="project-form" onSubmit={handleRequestSubmit}>
                    <h3 className="form-heading">
                      {lang === 'ar'
                        ? 'إرسال طلب معاينة أو خدمة لفريقنا'
                        : 'Envoyer une demande à notre équipe'}
                    </h3>

                    <div className="form-field">
                      <label className="form-label" htmlFor="req-title">
                        {lang === 'ar'
                          ? 'عنوان الطلب أو المشروع'
                          : 'Objet de la demande'}
                      </label>
                      <input
                        id="req-title"
                        type="text"
                        className="form-input"
                        placeholder={
                          lang === 'ar'
                            ? 'مثال: تجديد سيراميك الحمام أو لحام بوابة حديدية'
                            : 'Ex : Rénovation carrelage ou portail soudé'
                        }
                        maxLength={120}
                        required
                        value={reqTitle}
                        onChange={(e) => setReqTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="req-cat">
                        {lang === 'ar'
                          ? 'التخصص المطلوب'
                          : 'Spécialité recherchée'}
                      </label>
                      <select
                        id="req-cat"
                        className="form-input"
                        value={reqCategory}
                        onChange={(e) =>
                          setReqCategory(e.target.value as ServiceCategoryId)
                        }
                      >
                        {SERVICE_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {lang === 'ar' ? c.ar : c.fr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label className="form-label" htmlFor="req-wilaya">
                          {lang === 'ar' ? 'الولاية' : 'Wilaya'}
                        </label>
                        <select
                          id="req-wilaya"
                          className="form-input"
                          value={reqWilaya}
                          onChange={(e) => {
                            const wName = e.target.value;
                            setReqWilaya(wName);
                            const found = ALGERIA_WILAYAS.find(
                              (w) => w.ar === wName
                            );
                            if (found && found.communes[0]) {
                              setReqCommune(found.communes[0]);
                            }
                          }}
                        >
                          {ALGERIA_WILAYAS.map((w) => (
                            <option key={w.code} value={w.ar}>
                              {w.code} - {lang === 'ar' ? w.ar : w.fr}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="form-label" htmlFor="req-commune">
                          {lang === 'ar' ? 'البلدية' : 'Commune'}
                        </label>
                        <input
                          id="req-commune"
                          type="text"
                          list="req-communes-list"
                          className="form-input"
                          maxLength={60}
                          required
                          value={reqCommune}
                          onChange={(e) => setReqCommune(e.target.value)}
                        />
                        <datalist id="req-communes-list">
                          {reqCommunes.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="req-desc">
                        {lang === 'ar'
                          ? 'وصف المشروع أو المشكلة'
                          : 'Description du besoin'}
                      </label>
                      <textarea
                        id="req-desc"
                        className="form-input form-textarea"
                        rows={3}
                        maxLength={1500}
                        required
                        value={reqDesc}
                        onChange={(e) => setReqDesc(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="btn btn-ghost btn-sm upload-label">
                        <Upload size={15} />
                        <span>
                          {lang === 'ar'
                            ? 'إرفاق صورة رئيسية للموقع'
                            : 'Joindre une photo principale'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          disabled={processingImg}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f)
                              void processSingleFile(
                                f,
                                'requests',
                                setReqCover
                              );
                          }}
                        />
                      </label>
                      {reqCover && (
                        <div className="cover-preview">
                          <img src={reqCover} alt="Request" />
                          <button
                            type="button"
                            className="cover-remove"
                            onClick={() => setReqCover('')}
                          >
                            {lang === 'ar' ? 'إزالة' : 'Retirer'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="btn btn-ghost btn-sm upload-label">
                        <ImagePlus size={15} />
                        <span>
                          {lang === 'ar'
                            ? `صور إضافية (${reqExtras.length}/3)`
                            : `Photos supplémentaires (${reqExtras.length}/3)`}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          hidden
                          disabled={processingImg || reqExtras.length >= 3}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            e.target.value = '';
                            if (files.length)
                              void processBatchFiles(
                                files,
                                'requests',
                                reqExtras.length,
                                3,
                                (items) =>
                                  setReqExtras((prev) => [...prev, ...items])
                              );
                          }}
                        />
                      </label>
                      {reqExtras.length > 0 && (
                        <div className="extra-preview-grid">
                          {reqExtras.map((img, i) => (
                            <div key={i} className="extra-preview-item">
                              <img src={img.imageUrl} alt={img.caption} />
                              <button
                                type="button"
                                onClick={() =>
                                  setReqExtras((p) =>
                                    p.filter((_, idx) => idx !== i)
                                  )
                                }
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {errorMsg && <p className="form-error">{errorMsg}</p>}
                    {successMsg && <p className="form-success">{successMsg}</p>}

                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={submitting || processingImg}
                    >
                      <Plus size={17} />
                      <span>
                        {submitting
                          ? lang === 'ar'
                            ? 'جاري الإرسال...'
                            : 'Envoi...'
                          : lang === 'ar'
                            ? 'إرسال الطلب للفريق'
                            : 'Envoyer la demande'}
                      </span>
                    </button>
                  </form>

                  {allRequests.length > 0 && (
                    <div className="user-projects-list">
                      <h3 className="form-heading">
                        {isAdmin
                          ? lang === 'ar'
                            ? `طلبات الزبائن (${allRequests.length})`
                            : `Demandes clients (${allRequests.length})`
                          : lang === 'ar'
                            ? `طلباتي السابقة (${allRequests.length})`
                            : `Mes demandes (${allRequests.length})`}
                      </h3>
                      {allRequests.map((req) => (
                        <div key={req.id} className="user-proj-row">
                          <div className="user-proj-info">
                            <div className="user-proj-title">{req.title}</div>
                            <div className="user-proj-meta">
                              {getCategoryLabel(req.category, lang)} ·{' '}
                              {req.wilaya}
                            </div>
                          </div>
                          <div className="user-proj-actions">
                            <button
                              type="button"
                              className="icon-btn-xs"
                              title={lang === 'ar' ? 'معاينة' : 'Détails'}
                              onClick={() => onOpenRequestDetail(req)}
                            >
                              <ExternalLink size={14} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn-xs danger"
                              title={lang === 'ar' ? 'حذف' : 'Supprimer'}
                              onClick={() => void onDeleteRequest(req)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'messages' && (
                <div className="messages-panel">
                  <h3 className="form-heading">
                    {lang === 'ar'
                      ? `الرسائل الواردة (${incomingInquiries.length})`
                      : `Messages reçus (${incomingInquiries.length})`}
                  </h3>
                  {incomingInquiries.length === 0 ? (
                    <p className="user-proj-meta">
                      {lang === 'ar'
                        ? 'لا توجد رسائل واردة حالياً.'
                        : 'Aucun message reçu pour le moment.'}
                    </p>
                  ) : (
                    incomingInquiries.map((inq) => (
                      <div key={inq.id} className="inquiry-card">
                        <div className="inquiry-head">
                          <strong>{inq.senderName}</strong>
                          <span>
                            {inq.status === 'replied'
                              ? lang === 'ar'
                                ? 'تم الرد'
                                : 'Répondu'
                              : lang === 'ar'
                                ? 'جديد'
                                : 'Nouveau'}
                          </span>
                        </div>
                        <div className="inquiry-ctx">{inq.contextTitle}</div>
                        <p className="inquiry-body">{inq.message}</p>
                        {inq.contactInfo && (
                          <div className="inquiry-contact">
                            {lang === 'ar' ? 'وسيلة التواصل:' : 'Contact :'}{' '}
                            {inq.contactInfo}
                          </div>
                        )}
                        {inq.status === 'replied' ? (
                          <div className="inquiry-reply-box">
                            <strong>
                              {lang === 'ar' ? 'الرد:' : 'Réponse :'}
                            </strong>{' '}
                            {inq.replyText}
                          </div>
                        ) : (
                          <div className="url-inline">
                            <input
                              type="text"
                              className="form-input"
                              placeholder={
                                lang === 'ar'
                                  ? 'اكتب ردّك هنا...'
                                  : 'Écrivez votre réponse...'
                              }
                              maxLength={1000}
                              value={replyDrafts[inq.id] || ''}
                              onChange={(e) =>
                                setReplyDrafts((p) => ({
                                  ...p,
                                  [inq.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => void handleSendReply(inq)}
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  <h3 className="form-heading" style={{ marginTop: 12 }}>
                    {lang === 'ar'
                      ? `الرسائل المرسلة (${sentInquiries.length})`
                      : `Messages envoyés (${sentInquiries.length})`}
                  </h3>
                  {sentInquiries.length === 0 ? (
                    <p className="user-proj-meta">
                      {lang === 'ar'
                        ? 'لم ترسل أي رسالة بعد.'
                        : 'Aucun message envoyé.'}
                    </p>
                  ) : (
                    sentInquiries.map((inq) => (
                      <div key={inq.id} className="inquiry-card">
                        <div className="inquiry-head">
                          <strong>
                            {lang === 'ar' ? 'إلى:' : 'À :'} {inq.recipientName}
                          </strong>
                          <span>
                            {inq.status === 'replied'
                              ? lang === 'ar'
                                ? 'تم الرد'
                                : 'Répondu'
                              : lang === 'ar'
                                ? 'قيد الانتظار'
                                : 'En attente'}
                          </span>
                        </div>
                        <div className="inquiry-ctx">{inq.contextTitle}</div>
                        <p className="inquiry-body">{inq.message}</p>
                        {inq.replyText && (
                          <div className="inquiry-reply-box">
                            <strong>
                              {lang === 'ar' ? 'الرد:' : 'Réponse :'}
                            </strong>{' '}
                            {inq.replyText}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
