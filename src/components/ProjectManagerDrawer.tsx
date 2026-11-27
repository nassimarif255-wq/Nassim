import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { X, Upload, LogIn, LogOut, Trash2, Pencil, Plus, ImagePlus } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CATEGORY_LABELS,
  ProjectCategory,
  ProjectRecord,
} from '../data/showcaseDefaults';
import { compressImageFile } from '../utils/imageProcessor';

interface ProjectManagerDrawerProps {
  open: boolean;
  user: User | null;
  authLoading: boolean;
  isAdmin: boolean;
  editingProject: ProjectRecord | null;
  userProjects: ProjectRecord[];
  onClose: () => void;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onClearEdit: () => void;
  onEditProject: (project: ProjectRecord) => void;
  onDeleteProject: (project: ProjectRecord) => void;
}

const CATEGORIES: ProjectCategory[] = [
  'ceramics',
  'construction',
  'renovation',
  'kitchen_bath',
  'facades',
];

export function ProjectManagerDrawer({
  open,
  user,
  authLoading,
  isAdmin,
  editingProject,
  userProjects,
  onClose,
  onSignIn,
  onSignOut,
  onClearEdit,
  onEditProject,
  onDeleteProject,
}: ProjectManagerDrawerProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('ceramics');
  const [location, setLocation] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [extraImages, setExtraImages] = useState<
    { imageUrl: string; caption: string }[]
  >([]);
  const [urlInput, setUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [processingImg, setProcessingImg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (editingProject) {
      setTitle(editingProject.title);
      setCategory(editingProject.category);
      setLocation(editingProject.location);
      setAreaSqm(editingProject.areaSqm);
      setDescription(editingProject.description);
      setCoverImage(editingProject.coverImage);
      setExtraImages([]);
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      setTitle('');
      setCategory('ceramics');
      setLocation('');
      setAreaSqm('');
      setDescription('');
      setCoverImage('');
      setExtraImages([]);
      setUrlInput('');
      setErrorMsg('');
    }
  }, [editingProject, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg('');
    setProcessingImg(true);
    try {
      const compressed = await compressImageFile(file);
      setCoverImage(compressed);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'تعذر معالجة صورة الغلاف.'
      );
    } finally {
      setProcessingImg(false);
    }
  };

  const handleExtraFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const remaining = 4 - extraImages.length;
    if (remaining <= 0) {
      setErrorMsg('يمكن إضافة 4 صور إضافية كحد أقصى عند إنشاء العمل.');
      return;
    }

    setErrorMsg('');
    setProcessingImg(true);
    try {
      const batch = files.slice(0, remaining);
      const processed: { imageUrl: string; caption: string }[] = [];
      for (const f of batch) {
        const compressed = await compressImageFile(f);
        processed.push({
          imageUrl: compressed,
          caption: f.name.replace(/\.[^/.]+$/, '').slice(0, 120),
        });
      }
      setExtraImages((prev) => [...prev, ...processed]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'تعذر معالجة إحدى الصور المختارة.'
      );
    } finally {
      setProcessingImg(false);
    }
  };

  const applyCoverUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed.startsWith('https://')) {
      setErrorMsg('يجب أن يبدأ رابط الصورة بـ https://');
      return;
    }
    if (trimmed.length > 450000) {
      setErrorMsg('الرابط طويل جداً.');
      return;
    }
    setErrorMsg('');
    setCoverImage(trimmed);
    setUrlInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('يرجى تسجيل الدخول أولاً.');
      return;
    }
    if (!user.emailVerified) {
      setErrorMsg('يجب أن يكون البريد الإلكتروني للحساب مفعلاً.');
      return;
    }

    const cleanTitle = title.trim();
    const cleanLocation = location.trim();
    const cleanArea = areaSqm.trim();
    const cleanDesc = description.trim();

    if (cleanTitle.length < 3 || cleanTitle.length > 120) {
      setErrorMsg('عنوان المشروع يجب أن يكون بين 3 و 120 حرفاً.');
      return;
    }
    if (cleanLocation.length < 2 || cleanLocation.length > 80) {
      setErrorMsg('يرجى إدخال الولاية أو المدينة بشكل صحيح.');
      return;
    }
    if (cleanArea.length < 1 || cleanArea.length > 30) {
      setErrorMsg('يرجى إدخال المساحة أو حجم العمل (مثلاً: 150 م²).');
      return;
    }
    if (cleanDesc.length < 5 || cleanDesc.length > 1500) {
      setErrorMsg('يرجى كتابة وصف للعمل (5 أحرف على الأقل).');
      return;
    }
    if (!coverImage || coverImage.length < 10) {
      setErrorMsg('يرجى رفع صورة رئيسية للمشروع أو إدخال رابطها.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (editingProject) {
        const projectPath = `projects/${editingProject.id}`;
        await updateDoc(doc(db, 'projects', editingProject.id), {
          title: cleanTitle,
          category,
          location: cleanLocation,
          areaSqm: cleanArea,
          description: cleanDesc,
          coverImage,
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, projectPath)
        );
        setSuccessMsg('تم تحديث بيانات المشروع بنجاح.');
        onClearEdit();
      } else {
        const projectId = `proj_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 7)}`;
        const projectPath = `projects/${projectId}`;
        const ownerName = (user.displayName || 'عضو اخدم دارك').slice(0, 100);

        await setDoc(doc(db, 'projects', projectId), {
          title: cleanTitle,
          category,
          location: cleanLocation,
          areaSqm: cleanArea,
          description: cleanDesc,
          coverImage,
          ownerId: user.uid,
          ownerName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, projectPath)
        );

        for (let i = 0; i < extraImages.length; i++) {
          const photoId = `photo_${Date.now()}_${i}`;
          const photoPath = `projects/${projectId}/photos/${photoId}`;
          await setDoc(doc(db, 'projects', projectId, 'photos', photoId), {
            imageUrl: extraImages[i].imageUrl,
            caption: extraImages[i].caption.slice(0, 200),
            ownerId: user.uid,
            createdAt: serverTimestamp(),
          }).catch((err) =>
            handleFirestoreError(err, OperationType.CREATE, photoPath)
          );
        }

        setTitle('');
        setLocation('');
        setAreaSqm('');
        setDescription('');
        setCoverImage('');
        setExtraImages([]);
        setSuccessMsg('تم نشر المشروع والصور في المعرض العام بنجاح.');
      }
    } catch (err) {
      if (!errorMsg) {
        setErrorMsg(
          err instanceof Error ? err.message : 'تعذر حفظ المشروع، حاول مجدداً.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="drawer-backdrop"
        hidden={!open}
        onClick={onClose}
      />
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
              بوابة إضافة الأعمال والصور
            </h2>
            <p className="drawer-subtitle">اخدم دارك dz darkom pro</p>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="إغلاق البوابة"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {authLoading ? (
            <div className="drawer-empty">
              <p>جاري التحقق من جلسة المستخدم...</p>
            </div>
          ) : !user ? (
            <div className="auth-gate">
              <h3>تسجيل دخول المستخدم</h3>
              <p>
                العرض العام للمشاريع متاح للجميع. لإضافة أعمال بناء أو صور
                سيراميك وترميم جديدة أو تعديل منشوراتك، سجّل الدخول بحساب
                Google.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={onSignIn}
              >
                <LogIn size={18} />
                <span>الدخول بحساب Google</span>
              </button>
            </div>
          ) : (
            <div className="workspace-content">
              <div className="user-bar">
                <div className="user-bar-info">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'المستخدم'}
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
                      {isAdmin ? 'مدير المنصة' : 'مستخدم معتمد'} ·{' '}
                      {user.email}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onSignOut}
                >
                  <LogOut size={14} />
                  <span>خروج</span>
                </button>
              </div>

              <form className="project-form" onSubmit={handleSubmit}>
                <div className="form-header-row">
                  <h3 className="form-heading">
                    {editingProject ? 'تعديل المشروع' : 'إضافة عمل جديد للمعرض'}
                  </h3>
                  {editingProject && (
                    <button
                      type="button"
                      className="text-link-btn"
                      onClick={onClearEdit}
                    >
                      إلغاء التعديل
                    </button>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="proj-title">
                    عنوان المشروع
                  </label>
                  <input
                    id="proj-title"
                    type="text"
                    className="form-input"
                    placeholder="مثال: تبليط فيلا بالبورسلان الإسباني"
                    maxLength={120}
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label className="form-label" htmlFor="proj-cat">
                      التخصص
                    </label>
                    <select
                      id="proj-cat"
                      className="form-input"
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as ProjectCategory)
                      }
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="proj-area">
                      المساحة / الحجم
                    </label>
                    <input
                      id="proj-area"
                      type="text"
                      className="form-input"
                      placeholder="180 م²"
                      maxLength={30}
                      required
                      value={areaSqm}
                      onChange={(e) => setAreaSqm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="proj-loc">
                    الولاية والبلدية
                  </label>
                  <input
                    id="proj-loc"
                    type="text"
                    className="form-input"
                    placeholder="مثال: الشراقة، الجزائر العاصمة"
                    maxLength={80}
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="proj-desc">
                    وصف الأشغال والمواد
                  </label>
                  <textarea
                    id="proj-desc"
                    className="form-input form-textarea"
                    placeholder="اشرح تفاصيل البناء، نوع السيراميك أو البورسلان، ومدة التنفيذ..."
                    maxLength={1500}
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <span className="form-label">الصورة الرئيسية للمشروع</span>
                  <div className="upload-box">
                    <label className="btn btn-ghost btn-sm upload-label">
                      <Upload size={15} />
                      <span>
                        {processingImg
                          ? 'جاري ضغط الصورة...'
                          : 'اختيار صورة من الجهاز'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={processingImg}
                        onChange={handleCoverFile}
                      />
                    </label>
                    <div className="url-inline">
                      <input
                        type="url"
                        className="form-input"
                        placeholder="أو الصق رابط صورة https://..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={applyCoverUrl}
                      >
                        اعتماد
                      </button>
                    </div>
                  </div>
                  {coverImage && (
                    <div className="cover-preview">
                      <img
                        src={coverImage}
                        alt="معاينة الغلاف"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        className="cover-remove"
                        onClick={() => setCoverImage('')}
                      >
                        إزالة
                      </button>
                    </div>
                  )}
                </div>

                {!editingProject && (
                  <div className="form-field">
                    <span className="form-label">
                      صور إضافية للعمل (حتى 4 صور)
                    </span>
                    <label className="btn btn-ghost btn-sm upload-label">
                      <ImagePlus size={15} />
                      <span>إضافة صور تفصيلية ({extraImages.length}/4)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        disabled={processingImg || extraImages.length >= 4}
                        onChange={handleExtraFiles}
                      />
                    </label>

                    {extraImages.length > 0 && (
                      <div className="extra-preview-grid">
                        {extraImages.map((img, idx) => (
                          <div key={idx} className="extra-preview-item">
                            <img src={img.imageUrl} alt={img.caption} />
                            <button
                              type="button"
                              aria-label="حذف"
                              onClick={() =>
                                setExtraImages((prev) =>
                                  prev.filter((_, i) => i !== idx)
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
                      ? 'جاري الحفظ...'
                      : editingProject
                        ? 'حفظ التعديلات'
                        : 'نشر العمل في المعرض العام'}
                  </span>
                </button>
              </form>

              {userProjects.length > 0 && (
                <div className="user-projects-list">
                  <h3 className="form-heading">
                    الأعمال المنشورة ({userProjects.length})
                  </h3>
                  {userProjects.map((proj) => (
                    <div key={proj.id} className="user-proj-row">
                      <img
                        src={proj.coverImage}
                        alt={proj.title}
                        className="user-proj-thumb"
                        referrerPolicy="no-referrer"
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
                          title="تعديل"
                          onClick={() => onEditProject(proj)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn-xs danger"
                          title="حذف"
                          onClick={() => onDeleteProject(proj)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
