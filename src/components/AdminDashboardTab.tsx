import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Pencil, Plus, Trash2, DownloadCloud } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CURATED_SERVICES,
  CURATED_SKILLS,
  CURATED_TEAM_MEMBERS,
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
  hasFirestoreArtisans: boolean;
  onGoToArtisansTab: () => void;
  onGoToProjectsTab: () => void;
}

export function AdminDashboardTab({
  user,
  lang,
  firestoreSkills,
  firestoreServices,
  hasFirestoreArtisans,
  onGoToArtisansTab,
  onGoToProjectsTab,
}: AdminDashboardTabProps) {
  const [section, setSection] = useState<'skills' | 'services' | 'team'>(
    'skills'
  );
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  // Skill editor state
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skNameAr, setSkNameAr] = useState('');
  const [skNameFr, setSkNameFr] = useState('');
  const [skCat, setSkCat] = useState<ServiceCategoryId>('ceramics');
  const [skLevel, setSkLevel] = useState<SkillLevelId>('expert');
  const [skSummaryAr, setSkSummaryAr] = useState('');
  const [skSummaryFr, setSkSummaryFr] = useState('');
  const [skToolsAr, setSkToolsAr] = useState('');
  const [skOrder, setSkOrder] = useState('1');

  // Service guide editor state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [srvTitleAr, setSrvTitleAr] = useState('');
  const [srvTitleFr, setSrvTitleFr] = useState('');
  const [srvCat, setSrvCat] = useState<ServiceCategoryId>('ceramics');
  const [srvDuration, setSrvDuration] = useState('5 – 14 يوماً');
  const [srvNatureAr, setSrvNatureAr] = useState('');
  const [srvNatureFr, setSrvNatureFr] = useState('');
  const [srvDelivAr, setSrvDelivAr] = useState('');
  const [srvDelivFr, setSrvDelivFr] = useState('');
  const [srvStagesAr, setSrvStagesAr] = useState('');
  const [srvStagesFr, setSrvStagesFr] = useState('');
  const [srvOutcomeAr, setSrvOutcomeAr] = useState('');
  const [srvOutcomeFr, setSrvOutcomeFr] = useState('');
  const [srvOrder, setSrvOrder] = useState('1');

  const resetSkillForm = () => {
    setEditingSkillId(null);
    setSkNameAr('');
    setSkNameFr('');
    setSkCat('ceramics');
    setSkLevel('expert');
    setSkSummaryAr('');
    setSkSummaryFr('');
    setSkToolsAr('');
    setSkOrder(String(firestoreSkills.length + 1));
  };

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setSrvTitleAr('');
    setSrvTitleFr('');
    setSrvCat('ceramics');
    setSrvDuration('5 – 14 يوماً');
    setSrvNatureAr('');
    setSrvNatureFr('');
    setSrvDelivAr('');
    setSrvDelivFr('');
    setSrvStagesAr('');
    setSrvStagesFr('');
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
    const sFr = (skSummaryFr.trim() || sAr).slice(0, 350);

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
      if (editingSkillId) {
        const path = `skills/${editingSkillId}`;
        await updateDoc(doc(db, 'skills', editingSkillId), {
          nameAr: nAr.slice(0, 100),
          nameFr: nFr,
          category: skCat,
          level: skLevel,
          summaryAr: sAr.slice(0, 350),
          summaryFr: sFr,
          toolsAr: skToolsAr.trim().slice(0, 180),
          sortOrder: sortNum,
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, path)
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
          nameAr: nAr.slice(0, 100),
          nameFr: nFr,
          category: skCat,
          level: skLevel,
          summaryAr: sAr.slice(0, 350),
          summaryFr: sFr,
          toolsAr: skToolsAr.trim().slice(0, 180),
          sortOrder: sortNum,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
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
          summaryAr: sk.summaryAr,
          summaryFr: sk.summaryFr,
          toolsAr: sk.toolsAr,
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
          ? 'تم استيراد المهارات الأساسية في قاعدة البيانات.'
          : 'Compétences de base importées dans Firestore.'
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
        outcomeAr: oAr.slice(0, 500),
        outcomeFr: (srvOutcomeFr.trim() || oAr).slice(0, 500),
        durationLabel: (srvDuration.trim() || '7 – 14 يوماً').slice(0, 60),
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

  const handleSeedBaselineTeam = async () => {
    setSaving(true);
    setErrMsg('');
    try {
      for (const m of CURATED_TEAM_MEMBERS) {
        const id = m.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        await setDoc(doc(db, 'artisans', id), {
          displayName: m.displayName,
          roleTitle: m.roleTitle || '',
          profession: m.profession,
          experienceYears: m.experienceYears,
          wilaya: m.wilaya,
          commune: m.commune,
          bio: m.bio,
          skillsList: m.skillsList || [],
          avatarUrl: '',
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, `artisans/${id}`)
        );
      }
      setStatusMsg(
        lang === 'ar'
          ? 'تم استيراد أعضاء الفريق الأساسيين، يمكنك الآن تعديلهم.'
          : 'Membres de l’équipe importés dans Firestore.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workspace-content">
      <div className="admin-subnav" role="tablist">
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
          {lang === 'ar' ? 'شرح الخدمات' : 'Services'}
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
          {lang === 'ar' ? 'اختصارات الفريق' : 'Équipe & Projets'}
        </button>
      </div>

      {section === 'skills' && (
        <>
          {firestoreSkills.length === 0 && (
            <div className="auth-gate">
              <p>
                {lang === 'ar'
                  ? 'يتم حالياً عرض المهارات الافتراضية للفريق. استوردها لقاعدة البيانات لتتمكن من تعديلها أو حذفها.'
                  : 'Les compétences par défaut sont affichées. Importez-les dans Firestore pour les modifier ou supprimer.'}
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
                    ? 'استيراد المهارات الأساسية (8 مهارات)'
                    : 'Importer les compétences de base'}
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
                  {lang === 'ar' ? 'المستوى' : 'Niveau'}
                </label>
                <select
                  id="sk-level"
                  className="form-input"
                  value={skLevel}
                  onChange={(e) => setSkLevel(e.target.value as SkillLevelId)}
                >
                  <option value="expert">
                    {lang === 'ar' ? 'تخصص رئيسي' : 'Maîtrise experte'}
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

            <div className="form-field">
              <label className="form-label" htmlFor="sk-sum-ar">
                {lang === 'ar' ? 'وصف المهارة (عربي)' : 'Description (AR)'}
              </label>
              <textarea
                id="sk-sum-ar"
                className="form-input form-textarea"
                rows={2}
                maxLength={350}
                required
                value={skSummaryAr}
                onChange={(e) => setSkSummaryAr(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="sk-sum-fr">
                {lang === 'ar'
                  ? 'وصف المهارة (فرنسي - اختياري)'
                  : 'Description (FR)'}
              </label>
              <textarea
                id="sk-sum-fr"
                className="form-input form-textarea"
                rows={2}
                maxLength={350}
                value={skSummaryFr}
                onChange={(e) => setSkSummaryFr(e.target.value)}
              />
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label" htmlFor="sk-tools">
                  {lang === 'ar' ? 'الأدوات والتقنيات' : 'Outillage utilisé'}
                </label>
                <input
                  id="sk-tools"
                  type="text"
                  className="form-input"
                  maxLength={180}
                  value={skToolsAr}
                  onChange={(e) => setSkToolsAr(e.target.value)}
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
              {firestoreSkills.map((sk) => (
                <div key={sk.id} className="user-proj-row">
                  <div className="user-proj-info">
                    <div className="user-proj-title">
                      {lang === 'ar' ? sk.nameAr : sk.nameFr}
                    </div>
                    <div className="user-proj-meta">
                      {getCategoryLabel(sk.category, lang)}
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
                        setSkSummaryAr(sk.summaryAr);
                        setSkSummaryFr(sk.summaryFr);
                        setSkToolsAr(sk.toolsAr);
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
              ))}
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
                  ? 'يتم عرض شروحات الخدمات الافتراضية. استوردها لتتمكن من تعديلها أو إضافة خدمات جديدة.'
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
                    ? 'استيراد شروحات الخدمات (5 تخصصات)'
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
                  {lang === 'ar' ? 'المدة التقديرية' : 'Délai estimé'}
                </label>
                <input
                  id="srv-dur"
                  type="text"
                  className="form-input"
                  maxLength={60}
                  required
                  value={srvDuration}
                  onChange={(e) => setSrvDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="srv-nature">
                {lang === 'ar' ? '01. طبيعة العمل (عربي)' : '01. Nature (AR)'}
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
              <label className="form-label" htmlFor="srv-deliv">
                {lang === 'ar'
                  ? '02. الخدمات المقدمة (سطر لكل خدمة)'
                  : '02. Prestations (une par ligne)'}
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
              <label className="form-label" htmlFor="srv-stages">
                {lang === 'ar'
                  ? '03. مراحل التنفيذ (مرحلة في كل سطر)'
                  : '03. Étapes (une par ligne)'}
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
              <label className="form-label" htmlFor="srv-outcome">
                {lang === 'ar'
                  ? '04. النتيجة التي يحصل عليها الزبون'
                  : '04. Résultat client'}
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
                      {getCategoryLabel(srv.category, lang)} ·{' '}
                      {srv.durationLabel}
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

      {section === 'team' && (
        <div className="auth-gate">
          <h3>
            {lang === 'ar'
              ? 'إدارة أعضاء الفريق والمشاريع'
              : 'Gestion de l’équipe et des projets'}
          </h3>
          <p>
            {lang === 'ar'
              ? 'استخدم التبويبات أعلاه لإضافة وتعديل وحذف ملفات الحرفيين أو مشاريع قبل وبعد.'
              : 'Utilisez les onglets pour ajouter, modifier ou supprimer les membres et les chantiers avant/après.'}
          </p>
          {!hasFirestoreArtisans && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={saving}
              onClick={() => void handleSeedBaselineTeam()}
            >
              <DownloadCloud size={15} />
              <span>
                {lang === 'ar'
                  ? 'استيراد أعضاء الفريق الأساسيين في قاعدة البيانات'
                  : 'Importer les membres de base'}
              </span>
            </button>
          )}
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
