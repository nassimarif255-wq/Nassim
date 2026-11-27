import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  DownloadCloud,
  ExternalLink,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  type ArtisanRecord,
  CURATED_SERVICES,
  CURATED_SKILLS,
  type ServiceRequestRecord,
  type SkillLevelId,
  type TeamServiceGuideRecord,
  type TeamSkillRecord,
} from '../data/showcaseDefaults';
import {
  getCategoryLabel,
  SERVICE_CATEGORIES,
  type AppLang,
  type ServiceCategoryId,
} from '../data/i18n';

interface AdminDashboardTabProps {
  user: User;
  lang: AppLang;
  firestoreSkills: TeamSkillRecord[];
  firestoreServices: TeamServiceGuideRecord[];
  artisans: ArtisanRecord[];
  requests: ServiceRequestRecord[];
  onGoToArtisansTab: () => void;
  onGoToProjectsTab: () => void;
  onOpenRequestDetail: (req: ServiceRequestRecord) => void;
  onDeleteRequest: (req: ServiceRequestRecord) => Promise<void>;
}

export function AdminDashboardTab({
  user,
  lang,
  firestoreSkills,
  firestoreServices,
  artisans,
  requests,
  onGoToArtisansTab,
  onGoToProjectsTab,
  onOpenRequestDetail,
  onDeleteRequest,
}: AdminDashboardTabProps) {
  const [section, setSection] = useState<
    'skills' | 'services' | 'requests' | 'team'
  >('skills');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  // Skill editor state
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skNameAr, setSkNameAr] = useState('');
  const [skNameFr, setSkNameFr] = useState('');
  const [skCat, setSkCat] = useState<ServiceCategoryId>('ceramics');
  const [skLevel, setSkLevel] = useState<SkillLevelId>('expert');
  const [skExpLabel, setSkExpLabel] = useState('');
  const [skSummaryAr, setSkSummaryAr] = useState('');
  const [skSummaryFr, setSkSummaryFr] = useState('');
  const [skToolsAr, setSkToolsAr] = useState('');
  const [skToolsFr, setSkToolsFr] = useState('');
  const [skTasksAr, setSkTasksAr] = useState('');
  const [skTasksFr, setSkTasksFr] = useState('');
  const [skArtisanId, setSkArtisanId] = useState('');
  const [skOrder, setSkOrder] = useState('1');

  // Service guide editor state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [srvTitleAr, setSrvTitleAr] = useState('');
  const [srvTitleFr, setSrvTitleFr] = useState('');
  const [srvCat, setSrvCat] = useState<ServiceCategoryId>('ceramics');
  const [srvDuration, setSrvDuration] = useState('');
  const [srvNatureAr, setSrvNatureAr] = useState('');
  const [srvNatureFr, setSrvNatureFr] = useState('');
  const [srvDelivAr, setSrvDelivAr] = useState('');
  const [srvDelivFr, setSrvDelivFr] = useState('');
  const [srvStagesAr, setSrvStagesAr] = useState('');
  const [srvStagesFr, setSrvStagesFr] = useState('');
  const [srvMaterialsAr, setSrvMaterialsAr] = useState('');
  const [srvMaterialsFr, setSrvMaterialsFr] = useState('');
  const [srvQualityAr, setSrvQualityAr] = useState('');
  const [srvQualityFr, setSrvQualityFr] = useState('');
  const [srvOutcomeAr, setSrvOutcomeAr] = useState('');
  const [srvOutcomeFr, setSrvOutcomeFr] = useState('');
  const [srvOrder, setSrvOrder] = useState('1');

  // Request quick admin note drafts
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const resetSkillForm = () => {
    setEditingSkillId(null);
    setSkNameAr('');
    setSkNameFr('');
    setSkCat('ceramics');
    setSkLevel('expert');
    setSkExpLabel('');
    setSkSummaryAr('');
    setSkSummaryFr('');
    setSkToolsAr('');
    setSkToolsFr('');
    setSkTasksAr('');
    setSkTasksFr('');
    setSkArtisanId('');
    setSkOrder(String(firestoreSkills.length + 1));
  };

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setSrvTitleAr('');
    setSrvTitleFr('');
    setSrvCat('ceramics');
    setSrvDuration('');
    setSrvNatureAr('');
    setSrvNatureFr('');
    setSrvDelivAr('');
    setSrvDelivFr('');
    setSrvStagesAr('');
    setSrvStagesFr('');
    setSrvMaterialsAr('');
    setSrvMaterialsFr('');
    setSrvQualityAr('');
    setSrvQualityFr('');
    setSrvOutcomeAr('');
    setSrvOutcomeFr('');
    setSrvOrder(String(firestoreServices.length + 1));
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    setStatusMsg('');

    const nAr = skNameAr.trim();
    const nFr = (skNameFr.trim() || nAr).slice(0, 100);
    const sAr = skSummaryAr.trim();
    const sFr = (skSummaryFr.trim() || sAr).slice(0, 450);

    if (nAr.length < 2 || sAr.length < 5) {
      setErrMsg(
        lang === 'ar'
          ? 'يرجى إدخال اسم المهارة والوصف (5 أحرف على الأقل).'
          : 'Nom et description requis (min 5 caractères).'
      );
      return;
    }

    setSaving(true);
    try {
      const sortNum = Math.max(0, Math.min(999, Number(skOrder) || 1));
      const payload = {
        nameAr: nAr.slice(0, 100),
        nameFr: nFr,
        category: skCat,
        level: skLevel,
        experienceLabel: skExpLabel.trim().slice(0, 60),
        summaryAr: sAr.slice(0, 450),
        summaryFr: sFr,
        toolsAr: skToolsAr.trim().slice(0, 220),
        toolsFr: (skToolsFr.trim() || skToolsAr.trim()).slice(0, 220),
        tasksAr: skTasksAr.trim().slice(0, 600),
        tasksFr: (skTasksFr.trim() || skTasksAr.trim()).slice(0, 600),
        artisanId: skArtisanId,
        sortOrder: sortNum,
        updatedAt: serverTimestamp(),
      };

      if (editingSkillId) {
        const path = `skills/${editingSkillId}`;
        await updateDoc(doc(db, 'skills', editingSkillId), payload).catch(
          (err) => handleFirestoreError(err, OperationType.UPDATE, path)
        );
        setStatusMsg(
          lang === 'ar' ? 'تم تحديث المهارة بنجاح.' : 'Compétence mise à jour.'
        );
        resetSkillForm();
      } else {
        const id = `skill_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 6)}`;
        const path = `skills/${id}`;
        await setDoc(doc(db, 'skills', id), {
          ...payload,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, path)
        );
        setStatusMsg(
          lang === 'ar' ? 'تمت إضافة المهارة.' : 'Compétence ajoutée.'
        );
        resetSkillForm();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    const path = `skills/${id}`;
    await deleteDoc(doc(db, 'skills', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, path)
    );
    if (editingSkillId === id) resetSkillForm();
  };

  const handleSeedBaselineSkills = async () => {
    setSaving(true);
    setErrMsg('');
    try {
      for (const sk of CURATED_SKILLS) {
        const id = sk.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        await setDoc(doc(db, 'skills', id), {
          nameAr: sk.nameAr,
          nameFr: sk.nameFr,
          category: sk.category,
          level: sk.level,
          experienceLabel: sk.experienceLabel || '',
          summaryAr: sk.summaryAr,
          summaryFr: sk.summaryFr,
          toolsAr: sk.toolsAr,
          toolsFr: sk.toolsFr || sk.toolsAr,
          tasksAr: sk.tasksAr || '',
          tasksFr: sk.tasksFr || '',
          artisanId: '',
          sortOrder: sk.sortOrder,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, `skills/${id}`)
        );
      }
      setStatusMsg(
        lang === 'ar'
          ? 'تم استيراد قوالب المهارات التقنية في قاعدة البيانات.'
          : 'Modèles de compétences importés dans Firestore.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    setStatusMsg('');

    const tAr = srvTitleAr.trim();
    const tFr = (srvTitleFr.trim() || tAr).slice(0, 120);
    const nAr = srvNatureAr.trim();
    const dAr = srvDelivAr.trim();
    const stAr = srvStagesAr.trim();
    const oAr = srvOutcomeAr.trim();

    if (
      tAr.length < 3 ||
      nAr.length < 5 ||
      dAr.length < 5 ||
      stAr.length < 5 ||
      oAr.length < 5
    ) {
      setErrMsg(
        lang === 'ar'
          ? 'يرجى ملء العنوان وطبيعة العمل والخدمات والمراحل والنتيجة.'
          : 'Veuillez renseigner titre, nature, prestations, étapes et résultat.'
      );
      return;
    }

    setSaving(true);
    try {
      const sortNum = Math.max(0, Math.min(999, Number(srvOrder) || 1));
      const payload = {
        titleAr: tAr.slice(0, 120),
        titleFr: tFr,
        category: srvCat,
        natureAr: nAr.slice(0, 600),
        natureFr: (srvNatureFr.trim() || nAr).slice(0, 600),
        deliverablesAr: dAr.slice(0, 900),
        deliverablesFr: (srvDelivFr.trim() || dAr).slice(0, 900),
        stagesAr: stAr.slice(0, 900),
        stagesFr: (srvStagesFr.trim() || stAr).slice(0, 900),
        materialsToolsAr: srvMaterialsAr.trim().slice(0, 600),
        materialsToolsFr: (
          srvMaterialsFr.trim() || srvMaterialsAr.trim()
        ).slice(0, 600),
        qualityStandardsAr: srvQualityAr.trim().slice(0, 600),
        qualityStandardsFr: (
          srvQualityFr.trim() || srvQualityAr.trim()
        ).slice(0, 600),
        outcomeAr: oAr.slice(0, 500),
        outcomeFr: (srvOutcomeFr.trim() || oAr).slice(0, 500),
        durationLabel: srvDuration.trim().slice(0, 60),
        sortOrder: sortNum,
        updatedAt: serverTimestamp(),
      };

      if (editingServiceId) {
        const path = `services/${editingServiceId}`;
        await updateDoc(doc(db, 'services', editingServiceId), payload).catch(
          (err) => handleFirestoreError(err, OperationType.UPDATE, path)
        );
        setStatusMsg(
          lang === 'ar' ? 'تم تحديث شرح الخدمة.' : 'Service mis à jour.'
        );
        resetServiceForm();
      } else {
        const id = `srv_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 6)}`;
        const path = `services/${id}`;
        await setDoc(doc(db, 'services', id), {
          ...payload,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, path)
        );
        setStatusMsg(
          lang === 'ar' ? 'تمت إضافة الخدمة.' : 'Service ajouté.'
        );
        resetServiceForm();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    const path = `services/${id}`;
    await deleteDoc(doc(db, 'services', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, path)
    );
    if (editingServiceId === id) resetServiceForm();
  };

  const handleSeedBaselineServices = async () => {
    setSaving(true);
    setErrMsg('');
    try {
      for (const s of CURATED_SERVICES) {
        const id = s.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        await setDoc(doc(db, 'services', id), {
          titleAr: s.titleAr,
          titleFr: s.titleFr,
          category: s.category,
          natureAr: s.natureAr,
          natureFr: s.natureFr,
          deliverablesAr: s.deliverablesAr,
          deliverablesFr: s.deliverablesFr,
          stagesAr: s.stagesAr,
          stagesFr: s.stagesFr,
          materialsToolsAr: s.materialsToolsAr || '',
          materialsToolsFr: s.materialsToolsFr || '',
          qualityStandardsAr: s.qualityStandardsAr || '',
          qualityStandardsFr: s.qualityStandardsFr || '',
          outcomeAr: s.outcomeAr,
          outcomeFr: s.outcomeFr,
          durationLabel: s.durationLabel,
          sortOrder: s.sortOrder,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, `services/${id}`)
        );
      }
      setStatusMsg(
        lang === 'ar'
          ? 'تم استيراد شروحات الخدمات الأساسية.'
          : 'Fiches services de base importées.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAdminRequestUpdate = async (
    req: ServiceRequestRecord,
    nextStatus: 'open' | 'in_progress' | 'closed'
  ) => {
    const note = (
      noteDrafts[req.id] !== undefined ? noteDrafts[req.id] : req.adminNote || ''
    )
      .trim()
      .slice(0, 500);
    const path = `requests/${req.id}`;
    await updateDoc(doc(db, 'requests', req.id), {
      status: nextStatus,
      adminNote: note,
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
    setStatusMsg(
      lang === 'ar' ? 'تم حفظ تحديث الطلب.' : 'Demande mise à jour.'
    );
  };

  return (
    <div className="workspace-content">
      <div className="admin-subnav has-4" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={section === 'skills'}
          className={`seg-btn${section === 'skills' ? ' is-active' : ''}`}
          onClick={() => {
            setSection('skills');
            setErrMsg('');
            setStatusMsg('');
          }}
        >
          {lang === 'ar' ? 'المهارات' : 'Compétences'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'services'}
          className={`seg-btn${section === 'services' ? ' is-active' : ''}`}
          onClick={() => {
            setSection('services');
            setErrMsg('');
            setStatusMsg('');
          }}
        >
          {lang === 'ar' ? 'الخدمات' : 'Services'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'requests'}
          className={`seg-btn${section === 'requests' ? ' is-active' : ''}`}
          onClick={() => {
            setSection('requests');
            setErrMsg('');
            setStatusMsg('');
          }}
        >
          {lang === 'ar'
            ? `الطلبات (${requests.length})`
            : `Demandes (${requests.length})`}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'team'}
          className={`seg-btn${section === 'team' ? ' is-active' : ''}`}
          onClick={() => {
            setSection('team');
            setErrMsg('');
            setStatusMsg('');
          }}
        >
          {lang === 'ar' ? 'الفريق والمشاريع' : 'Équipe & Projets'}
        </button>
      </div>

      {section === 'skills' && (
        <>
          {firestoreSkills.length === 0 && (
            <div className="auth-gate">
              <p>
                {lang === 'ar'
                  ? 'يتم حالياً عرض القوالب التقنية للمهارات. استوردها لقاعدة البيانات لتتمكن من تعديلها وربطها بأعضاء فريقك الفعليين.'
                  : 'Les modèles techniques par défaut sont affichés. Importez-les dans Firestore pour les éditer et les lier aux membres.'}
              </p>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={saving}
                onClick={() => void handleSeedBaselineSkills()}
              >
                <DownloadCloud size={15} />
                <span>
                  {lang === 'ar'
                    ? 'استيراد قوالب المهارات الأساسية (8 مهارات)'
                    : 'Importer les modèles de compétences'}
                </span>
              </button>
            </div>
          )}

          <form className="project-form" onSubmit={handleSaveSkill}>
            <div className="form-header-row">
              <h3 className="form-heading">
                {editingSkillId
                  ? lang === 'ar'
                    ? 'تعديل مهارة'
                    : 'Modifier la compétence'
                  : lang === 'ar'
                    ? 'إضافة مهارة جديدة للفريق'
                    : 'Ajouter une compétence'}
              </h3>
              {editingSkillId && (
                <button
                  type="button"
                  className="text-link-btn"
                  onClick={resetSkillForm}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
              )}
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label" htmlFor="sk-name-ar">
                  {lang === 'ar' ? 'اسم المهارة (عربي)' : 'Nom (AR)'}
                </label>
                <input
                  id="sk-name-ar"
                  type="text"
                  className="form-input"
                  maxLength={100}
                  required
                  value={skNameAr}
                  onChange={(e) => setSkNameAr(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="sk-name-fr">
                  {lang === 'ar' ? 'الاسم بالفرنسية' : 'Nom (FR)'}
                </label>
                <input
                  id="sk-name-fr"
                  type="text"
                  className="form-input"
                  maxLength={100}
                  value={skNameFr}
                  onChange={(e) => setSkNameFr(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label" htmlFor="sk-cat">
                  {lang === 'ar' ? 'التخصص' : 'Spécialité'}
                </label>
                <select
                  id="sk-cat"
                  className="form-input"
                  value={skCat}
                  onChange={(e) =>
                    setSkCat(e.target.value as ServiceCategoryId)
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
                <label className="form-label" htmlFor="sk-level">
                  {lang === 'ar' ? 'مستوى الإتقان' : 'Niveau'}
                </label>
                <select
                  id="sk-level"
                  className="form-input"
                  value={skLevel}
                  onChange={(e) => setSkLevel(e.target.value as SkillLevelId)}
                >
                  <option value="expert">
                    {lang === 'ar' ? 'تخصص رئيسي / خبير' : 'Maîtrise experte'}
                  </option>
                  <option value="certified">
                    {lang === 'ar' ? 'معايير هندسية' : 'Normé & certifié'}
                  </option>
                  <option value="advanced">
                    {lang === 'ar' ? 'مستوى متقدم' : 'Avancé'}
                  </option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label" htmlFor="sk-exp-lbl">
                  {lang === 'ar'
                    ? 'وسم الخبرة (اختياري)'
                    : 'Mention d’expérience (opt.)'}
                </label>
                <input
                  id="sk-exp-lbl"
                  type="text"
                  className="form-input"
                  maxLength={60}
                  placeholder={
                    lang === 'ar' ? 'مثال: تشطيب دقيق' : 'Ex : Finition haute précision'
                  }
                  value={skExpLabel}
                  onChange={(e) => setSkExpLabel(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="sk-member">
                  {lang === 'ar'
                    ? 'العضو المختص بهذه المهارة'
                    : 'Membre référent'}
                </label>
                <select
                  id="sk-member"
                  className="form-input"
                  value={skArtisanId}
                  onChange={(e) => setSkArtisanId(e.target.value)}
                >
                  <option value="">
                    {lang === 'ar' ? 'كل الفريق' : 'Toute l’équipe'}
                  </option>
                  {artisans.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="sk-sum-ar">
                {lang === 'ar' ? 'الوصف التفصيلي (عربي)' : 'Description (AR)'}
              </label>
              <textarea
                id="sk-sum-ar"
                className="form-input form-textarea"
                rows={2}
                maxLength={450}
                required
                value={skSummaryAr}
                onChange={(e) => setSkSummaryAr(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="sk-sum-fr">
                {lang === 'ar'
                  ? 'الوصف التفصيلي (فرنسي - اختياري)'
                  : 'Description (FR)'}
              </label>
              <textarea
                id="sk-sum-fr"
                className="form-input form-textarea"
                rows={2}
                maxLength={450}
                value={skSummaryFr}
                onChange={(e) => setSkSummaryFr(e.target.value)}
              />
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label" htmlFor="sk-tools">
                  {lang === 'ar'
                    ? 'الأدوات والتقنيات (عربي)'
                    : 'Outillage (AR)'}
                </label>
                <input
                  id="sk-tools"
                  type="text"
                  className="form-input"
                  maxLength={220}
                  value={skToolsAr}
                  onChange={(e) => setSkToolsAr(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="sk-tools-fr">
                  {lang === 'ar'
                    ? 'الأدوات والتقنيات (فرنسي - اختياري)'
                    : 'Outillage (FR)'}
                </label>
                <input
                  id="sk-tools-fr"
                  type="text"
                  className="form-input"
                  maxLength={220}
                  value={skToolsFr}
                  onChange={(e) => setSkToolsFr(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="sk-tasks-ar">
                {lang === 'ar'
                  ? 'المهام التي ينفذها العضو (مهمة في كل سطر)'
                  : 'Tâches exécutées (AR - une par ligne)'}
              </label>
              <textarea
                id="sk-tasks-ar"
                className="form-input form-textarea"
                rows={3}
                maxLength={600}
                value={skTasksAr}
                onChange={(e) => setSkTasksAr(e.target.value)}
              />
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label" htmlFor="sk-tasks-fr">
                  {lang === 'ar'
                    ? 'المهام بالفرنسية (اختياري)'
                    : 'Tâches exécutées (FR)'}
                </label>
                <textarea
                  id="sk-tasks-fr"
                  className="form-input form-textarea"
                  rows={2}
                  maxLength={600}
                  value={skTasksFr}
                  onChange={(e) => setSkTasksFr(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="sk-order">
                  {lang === 'ar' ? 'الترتيب' : 'Ordre'}
                </label>
                <input
                  id="sk-order"
                  type="number"
                  min={0}
                  max={999}
                  className="form-input"
                  value={skOrder}
                  onChange={(e) => setSkOrder(e.target.value)}
                />
              </div>
            </div>

            {errMsg && <p className="form-error">{errMsg}</p>}
            {statusMsg && <p className="form-success">{statusMsg}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={saving}
            >
              <Plus size={16} />
              <span>
                {editingSkillId
                  ? lang === 'ar'
                    ? 'حفظ تعديلات المهارة'
                    : 'Mettre à jour'
                  : lang === 'ar'
                    ? 'إضافة المهارة'
                    : 'Ajouter la compétence'}
              </span>
            </button>
          </form>

          {firestoreSkills.length > 0 && (
            <div className="user-projects-list">
              <h3 className="form-heading">
                {lang === 'ar'
                  ? `المهارات المسجلة (${firestoreSkills.length})`
                  : `Compétences (${firestoreSkills.length})`}
              </h3>
              {firestoreSkills.map((sk) => {
                const linkedMember = artisans.find(
                  (a) => a.id === sk.artisanId
                );
                return (
                  <div key={sk.id} className="user-proj-row">
                    <div className="user-proj-info">
                      <div className="user-proj-title">
                        {lang === 'ar' ? sk.nameAr : sk.nameFr}
                      </div>
                      <div className="user-proj-meta">
                        {getCategoryLabel(sk.category, lang)}
                        {linkedMember ? ` · ${linkedMember.displayName}` : ''}
                      </div>
                    </div>
                    <div className="user-proj-actions">
                      <button
                        type="button"
                        className="icon-btn-xs"
                        onClick={() => {
                          setEditingSkillId(sk.id);
                          setSkNameAr(sk.nameAr);
                          setSkNameFr(sk.nameFr);
                          setSkCat(sk.category);
                          setSkLevel(sk.level);
                          setSkExpLabel(sk.experienceLabel || '');
                          setSkSummaryAr(sk.summaryAr);
                          setSkSummaryFr(sk.summaryFr);
                          setSkToolsAr(sk.toolsAr);
                          setSkToolsFr(sk.toolsFr || '');
                          setSkTasksAr(sk.tasksAr || '');
                          setSkTasksFr(sk.tasksFr || '');
                          setSkArtisanId(sk.artisanId || '');
                          setSkOrder(String(sk.sortOrder));
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn-xs danger"
                        onClick={() => void handleDeleteSkill(sk.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {section === 'services' && (
        <>
          {firestoreServices.length === 0 && (
            <div className="auth-gate">
              <p>
                {lang === 'ar'
                  ? 'يتم عرض قوالب شروحات الخدمات الافتراضية. استوردها لتتمكن من تعديلها أو إضافة خدمات جديدة.'
                  : 'Fiches services par défaut affichées. Importez-les pour les éditer.'}
              </p>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={saving}
                onClick={() => void handleSeedBaselineServices()}
              >
                <DownloadCloud size={15} />
                <span>
                  {lang === 'ar'
                    ? 'استيراد شروحات الخدمات الأساسية (5 تخصصات)'
                    : 'Importer les services de base'}
                </span>
              </button>
            </div>
          )}

          <form className="project-form" onSubmit={handleSaveService}>
            <div className="form-header-row">
              <h3 className="form-heading">
                {editingServiceId
                  ? lang === 'ar'
                    ? 'تعديل شرح الخدمة'
                    : 'Modifier le service'
                  : lang === 'ar'
                    ? 'إضافة شرح خدمة جديد'
                    : 'Ajouter une fiche service'}
              </h3>
              {editingServiceId && (
                <button
                  type="button"
                  className="text-link-btn"
                  onClick={resetServiceForm}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
              )}
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label" htmlFor="srv-title-ar">
                  {lang === 'ar' ? 'عنوان الخدمة (عربي)' : 'Titre (AR)'}
                </label>
                <input
                  id="srv-title-ar"
                  type="text"
                  className="form-input"
                  maxLength={120}
                  required
                  value={srvTitleAr}
                  onChange={(e) => setSrvTitleAr(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="srv-title-fr">
                  {lang === 'ar' ? 'العنوان (فرنسي)' : 'Titre (FR)'}
                </label>
                <input
                  id="srv-title-fr"
                  type="text"
                  className="form-input"
                  maxLength={120}
                  value={srvTitleFr}
                  onChange={(e) => setSrvTitleFr(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label" htmlFor="srv-cat">
                  {lang === 'ar' ? 'التخصص' : 'Spécialité'}
                </label>
                <select
                  id="srv-cat"
                  className="form-input"
                  value={srvCat}
                  onChange={(e) =>
                    setSrvCat(e.target.value as ServiceCategoryId)
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
                <label className="form-label" htmlFor="srv-dur">
                  {lang === 'ar'
                    ? 'المدة التقديرية (اختياري)'
                    : 'Délai estimé (opt.)'}
                </label>
                <input
                  id="srv-dur"
                  type="text"
                  className="form-input"
                  maxLength={60}
                  placeholder={
                    lang === 'ar'
                      ? 'تُحدد بعد المعاينة'
                      : 'Selon visite technique'
                  }
                  value={srvDuration}
                  onChange={(e) => setSrvDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="srv-nature">
                {lang === 'ar'
                  ? '01. تعريف الخدمة وطبيعة العمل (عربي)'
                  : '01. Nature (AR)'}
              </label>
              <textarea
                id="srv-nature"
                className="form-input form-textarea"
                rows={2}
                maxLength={600}
                required
                value={srvNatureAr}
                onChange={(e) => setSrvNatureAr(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="srv-nature-fr">
                {lang === 'ar'
                  ? '01. تعريف الخدمة (فرنسي - اختياري)'
                  : '01. Nature (FR)'}
              </label>
              <textarea
                id="srv-nature-fr"
                className="form-input form-textarea"
                rows={2}
                maxLength={600}
                value={srvNatureFr}
                onChange={(e) => setSrvNatureFr(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="srv-deliv">
                {lang === 'ar'
                  ? '02. الأشغال المقدمة (سطر لكل خدمة)'
                  : '02. Prestations (AR - une par ligne)'}
              </label>
              <textarea
                id="srv-deliv"
                className="form-input form-textarea"
                rows={3}
                maxLength={900}
                required
                value={srvDelivAr}
                onChange={(e) => setSrvDelivAr(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="srv-deliv-fr">
                {lang === 'ar'
                  ? '02. الأشغال المقدمة (فرنسي - اختياري)'
                  : '02. Prestations (FR)'}
              </label>
              <textarea
                id="srv-deliv-fr"
                className="form-input form-textarea"
                rows={2}
                maxLength={900}
                value={srvDelivFr}
                onChange={(e) => setSrvDelivFr(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="srv-stages">
                {lang === 'ar'
                  ? '03. مراحل التنفيذ (مرحلة في كل سطر)'
                  : '03. Étapes (AR - une par ligne)'}
              </label>
              <textarea
                id="srv-stages"
                className="form-input form-textarea"
                rows={3}
                maxLength={900}
                required
                value={srvStagesAr}
                onChange={(e) => setSrvStagesAr(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="srv-stages-fr">
                {lang === 'ar'
                  ? '03. مراحل التنفيذ (فرنسي - اختياري)'
                  : '03. Étapes (FR)'}
              </label>
              <textarea
                id="srv-stages-fr"
                className="form-input form-textarea"
                rows={2}
                maxLength={900}
                value={srvStagesFr}
                onChange={(e) => setSrvStagesFr(e.target.value)}
              />
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label" htmlFor="srv-materials-ar">
                  {lang === 'ar'
                    ? '04. المواد والأدوات (عربي)'
                    : '04. Matériaux & outils (AR)'}
                </label>
                <textarea
                  id="srv-materials-ar"
                  className="form-input form-textarea"
                  rows={2}
                  maxLength={600}
                  value={srvMaterialsAr}
                  onChange={(e) => setSrvMaterialsAr(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="srv-materials-fr">
                  {lang === 'ar'
                    ? '04. المواد والأدوات (فرنسي - اختياري)'
                    : '04. Matériaux & outils (FR)'}
                </label>
                <textarea
                  id="srv-materials-fr"
                  className="form-input form-textarea"
                  rows={2}
                  maxLength={600}
                  value={srvMaterialsFr}
                  onChange={(e) => setSrvMaterialsFr(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label" htmlFor="srv-quality-ar">
                  {lang === 'ar'
                    ? '05. معايير الجودة والضمان (عربي)'
                    : '05. Critères qualité (AR)'}
                </label>
                <textarea
                  id="srv-quality-ar"
                  className="form-input form-textarea"
                  rows={2}
                  maxLength={600}
                  value={srvQualityAr}
                  onChange={(e) => setSrvQualityAr(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="srv-quality-fr">
                  {lang === 'ar'
                    ? '05. معايير الجودة (فرنسي - اختياري)'
                    : '05. Critères qualité (FR)'}
                </label>
                <textarea
                  id="srv-quality-fr"
                  className="form-input form-textarea"
                  rows={2}
                  maxLength={600}
                  value={srvQualityFr}
                  onChange={(e) => setSrvQualityFr(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="srv-outcome">
                {lang === 'ar'
                  ? '06. النتيجة النهائية للزبون (عربي)'
                  : '06. Résultat client (AR)'}
              </label>
              <textarea
                id="srv-outcome"
                className="form-input form-textarea"
                rows={2}
                maxLength={500}
                required
                value={srvOutcomeAr}
                onChange={(e) => setSrvOutcomeAr(e.target.value)}
              />
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label" htmlFor="srv-outcome-fr">
                  {lang === 'ar'
                    ? '06. النتيجة (فرنسي - اختياري)'
                    : '06. Résultat client (FR)'}
                </label>
                <textarea
                  id="srv-outcome-fr"
                  className="form-input form-textarea"
                  rows={2}
                  maxLength={500}
                  value={srvOutcomeFr}
                  onChange={(e) => setSrvOutcomeFr(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="srv-order">
                  {lang === 'ar' ? 'الترتيب' : 'Ordre'}
                </label>
                <input
                  id="srv-order"
                  type="number"
                  min={0}
                  max={999}
                  className="form-input"
                  value={srvOrder}
                  onChange={(e) => setSrvOrder(e.target.value)}
                />
              </div>
            </div>

            {errMsg && <p className="form-error">{errMsg}</p>}
            {statusMsg && <p className="form-success">{statusMsg}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={saving}
            >
              <Plus size={16} />
              <span>
                {editingServiceId
                  ? lang === 'ar'
                    ? 'حفظ تعديلات الخدمة'
                    : 'Mettre à jour'
                  : lang === 'ar'
                    ? 'نشر شرح الخدمة'
                    : 'Publier le service'}
              </span>
            </button>
          </form>

          {firestoreServices.length > 0 && (
            <div className="user-projects-list">
              <h3 className="form-heading">
                {lang === 'ar'
                  ? `الخدمات المسجلة (${firestoreServices.length})`
                  : `Services enregistrés (${firestoreServices.length})`}
              </h3>
              {firestoreServices.map((srv) => (
                <div key={srv.id} className="user-proj-row">
                  <div className="user-proj-info">
                    <div className="user-proj-title">
                      {lang === 'ar' ? srv.titleAr : srv.titleFr}
                    </div>
                    <div className="user-proj-meta">
                      {getCategoryLabel(srv.category, lang)}
                      {srv.durationLabel ? ` · ${srv.durationLabel}` : ''}
                    </div>
                  </div>
                  <div className="user-proj-actions">
                    <button
                      type="button"
                      className="icon-btn-xs"
                      onClick={() => {
                        setEditingServiceId(srv.id);
                        setSrvTitleAr(srv.titleAr);
                        setSrvTitleFr(srv.titleFr);
                        setSrvCat(srv.category);
                        setSrvDuration(srv.durationLabel);
                        setSrvNatureAr(srv.natureAr);
                        setSrvNatureFr(srv.natureFr);
                        setSrvDelivAr(srv.deliverablesAr);
                        setSrvDelivFr(srv.deliverablesFr);
                        setSrvStagesAr(srv.stagesAr);
                        setSrvStagesFr(srv.stagesFr);
                        setSrvMaterialsAr(srv.materialsToolsAr || '');
                        setSrvMaterialsFr(srv.materialsToolsFr || '');
                        setSrvQualityAr(srv.qualityStandardsAr || '');
                        setSrvQualityFr(srv.qualityStandardsFr || '');
                        setSrvOutcomeAr(srv.outcomeAr);
                        setSrvOutcomeFr(srv.outcomeFr);
                        setSrvOrder(String(srv.sortOrder));
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-xs danger"
                      onClick={() => void handleDeleteService(srv.id)}
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

      {section === 'requests' && (
        <div className="messages-panel">
          <h3 className="form-heading">
            {lang === 'ar'
              ? `طلبات الزبائن الواردة (${requests.length})`
              : `Demandes clients reçues (${requests.length})`}
          </h3>
          {statusMsg && <p className="form-success">{statusMsg}</p>}
          {requests.length === 0 ? (
            <p className="user-proj-meta">
              {lang === 'ar'
                ? 'لا توجد طلبات زبائن مسجلة حالياً.'
                : 'Aucune demande client enregistrée.'}
            </p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="inquiry-card">
                <div className="inquiry-head">
                  <strong>{req.title}</strong>
                  <span>{req.ownerName}</span>
                </div>
                <div className="inquiry-ctx">
                  {getCategoryLabel(req.category, lang)} · {req.wilaya} -{' '}
                  {req.commune}
                </div>
                <p className="inquiry-body">{req.description}</p>

                <div className="form-row-2">
                  <select
                    className="form-input"
                    aria-label="Status"
                    value={req.status}
                    onChange={(e) =>
                      void handleAdminRequestUpdate(
                        req,
                        e.target.value as 'open' | 'in_progress' | 'closed'
                      )
                    }
                  >
                    <option value="open">
                      {lang === 'ar' ? 'قيد المراجعة' : 'À l’étude'}
                    </option>
                    <option value="in_progress">
                      {lang === 'ar' ? 'قيد التنفيذ' : 'En cours'}
                    </option>
                    <option value="closed">
                      {lang === 'ar' ? 'مكتمل / مغلق' : 'Clôturé'}
                    </option>
                  </select>
                  <div className="user-proj-actions" style={{ justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onOpenRequestDetail(req)}
                    >
                      <ExternalLink size={14} />
                      <span>{lang === 'ar' ? 'التفاصيل' : 'Détails'}</span>
                    </button>
                    <button
                      type="button"
                      className="icon-btn-xs danger"
                      onClick={() => void onDeleteRequest(req)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="url-inline">
                  <input
                    type="text"
                    className="form-input"
                    maxLength={500}
                    placeholder={
                      lang === 'ar'
                        ? 'ملاحظة الإدارة للزبون...'
                        : 'Note admin pour le client...'
                    }
                    value={
                      noteDrafts[req.id] !== undefined
                        ? noteDrafts[req.id]
                        : req.adminNote || ''
                    }
                    onChange={(e) =>
                      setNoteDrafts((p) => ({
                        ...p,
                        [req.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      void handleAdminRequestUpdate(req, req.status)
                    }
                  >
                    <Save size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === 'team' && (
        <div className="auth-gate">
          <h3>
            {lang === 'ar'
              ? 'إدارة أعضاء الفريق والمشاريع الحقيقية'
              : 'Gestion de l’équipe et des projets réels'}
          </h3>
          <p>
            {lang === 'ar'
              ? 'أضف أعضاء فريقك الفعليين وحدّث المشاريع المنجزة مع صور قبل وبعد مباشرة من التبويبات أعلاه. لا يتم عرض أي عضو أو مشروع وهمي في الموقع.'
              : 'Ajoutez vos vrais membres d’équipe et vos chantiers avant/après directement depuis les onglets ci-dessus.'}
          </p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onGoToArtisansTab}
            >
              {lang === 'ar' ? 'إدارة ملفات الأعضاء' : 'Gérer les membres'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onGoToProjectsTab}
            >
              {lang === 'ar'
                ? 'إدارة المشاريع (قبل/بعد)'
                : 'Gérer les projets'}
            </button>
          </div>
          {statusMsg && <p className="form-success">{statusMsg}</p>}
        </div>
      )}
    </div>
  );
}
