import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { MoveHorizontal, Pencil, Trash2, Upload, X } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ProjectPhotoItem, ProjectRecord } from '../data/showcaseDefaults';
import { AppLang, getCategoryLabel } from '../data/i18n';
import { uploadMediaImage } from '../utils/mediaStorage';

interface ProjectLightboxProps {
  project: ProjectRecord | null;
  user: User | null;
  isAdmin: boolean;
  lang: AppLang;
  onClose: () => void;
  onEdit: (project: ProjectRecord) => void;
  onDelete: (project: ProjectRecord) => void;
}

export function ProjectLightbox({
  project,
  user,
  isAdmin,
  lang,
  onClose,
  onEdit,
  onDelete,
}: ProjectLightboxProps) {
  const [extraPhotos, setExtraPhotos] = useState<ProjectPhotoItem[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'compare' | 'gallery'>('gallery');
  const [compareSplit, setCompareSplit] = useState(50);
  const [draggingSplit, setDraggingSplit] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    setActivePhotoIdx(0);
    setPhotoError('');
    setPhotoCaption('');
    setCompareSplit(50);
    setViewMode(project?.beforeImage ? 'compare' : 'gallery');
  }, [project?.id, project?.beforeImage]);

  useEffect(() => {
    if (!project) {
      setExtraPhotos([]);
      return;
    }

    const photosPath = `projects/${project.id}/photos`;
    const q = query(collection(db, photosPath), orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: ProjectPhotoItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            imageUrl: String(data.imageUrl || ''),
            caption: String(data.caption || ''),
            ownerId: String(data.ownerId || ''),
          };
        });
        setExtraPhotos(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, photosPath);
      }
    );

    return () => unsub();
  }, [project]);

  useEffect(() => {
    if (!project) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [project, onClose]);

  if (!project) return null;

  // Strict Official Team RBAC: only verified Admin manages projects
  const canManage = !!user && user.emailVerified && isAdmin;

  const allPhotos: { id?: string; imageUrl: string; caption: string }[] = [
    { imageUrl: project.coverImage, caption: project.title },
    ...(project.beforeImage
      ? [
          {
            imageUrl: project.beforeImage,
            caption:
              lang === 'ar'
                ? 'صورة الموقع قبل بدء الأشغال'
                : 'État avant travaux',
          },
        ]
      : []),
    ...extraPhotos.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      caption: p.caption,
    })),
  ];

  const safeIdx = activePhotoIdx < allPhotos.length ? activePhotoIdx : 0;
  const activePhoto = allPhotos[safeIdx];

  const handleAddPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user || !canManage) return;

    setPhotoError('');
    setAddingPhoto(true);
    try {
      const uri = await uploadMediaImage(file, 'projects', user.uid);
      const photoId = `photo_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const path = `projects/${project.id}/photos/${photoId}`;
      await setDoc(doc(db, 'projects', project.id, 'photos', photoId), {
        imageUrl: uri,
        caption: photoCaption.trim().slice(0, 200) || project.title,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
      setPhotoCaption('');
      setViewMode('gallery');
      setActivePhotoIdx(allPhotos.length);
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : 'تعذر رفع الصورة الإضافية.'
      );
    } finally {
      setAddingPhoto(false);
    }
  };

  const handleDeleteExtraPhoto = async (photoId: string) => {
    if (!user || !canManage) return;
    const path = `projects/${project.id}/photos/${photoId}`;
    try {
      await deleteDoc(doc(db, 'projects', project.id, 'photos', photoId));
      setActivePhotoIdx(0);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const updateCompareFromPointer = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setCompareSplit(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      onClick={onClose}
    >
      <div className="lightbox-shell" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-top">
          <div className="lightbox-meta-line">
            <span>{getCategoryLabel(project.category, lang)}</span>
            <span aria-hidden="true">·</span>
            <span>{project.location}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{project.areaSqm}</span>
            <span aria-hidden="true">·</span>
            <span>{project.ownerName}</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label={lang === 'ar' ? 'إغلاق المعاينة' : 'Fermer'}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="lightbox-body">
          <div className="lightbox-media-col">
            {project.beforeImage && (
              <div
                className="segmented-control"
                style={{ marginTop: 0 }}
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'compare'}
                  className={`seg-btn${viewMode === 'compare' ? ' is-active' : ''}`}
                  onClick={() => setViewMode('compare')}
                >
                  {lang === 'ar'
                    ? 'مقارنة قبل / بعد'
                    : 'Comparatif Avant / Après'}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'gallery'}
                  className={`seg-btn${viewMode === 'gallery' ? ' is-active' : ''}`}
                  onClick={() => setViewMode('gallery')}
                >
                  {lang === 'ar'
                    ? `جميع الصور (${allPhotos.length})`
                    : `Galerie (${allPhotos.length})`}
                </button>
              </div>
            )}

            {project.beforeImage && viewMode === 'compare' ? (
              <div
                className="comparison-wrap"
                dir="ltr"
                onPointerDown={(e) => {
                  setDraggingSplit(true);
                  e.currentTarget.setPointerCapture(e.pointerId);
                  updateCompareFromPointer(e);
                }}
                onPointerMove={(e) => {
                  if (draggingSplit) updateCompareFromPointer(e);
                }}
                onPointerUp={() => setDraggingSplit(false)}
                onPointerCancel={() => setDraggingSplit(false)}
              >
                <div className="comparison-layer">
                  <img
                    src={project.coverImage}
                    alt={lang === 'ar' ? 'بعد التسليم' : 'Après travaux'}
                    className="comparison-img"
                    referrerPolicy="no-referrer"
                  />
                  <span className="comp-corner-tag comp-corner-right">
                    {lang === 'ar' ? 'بعد الأشغال' : 'Après'}
                  </span>
                </div>
                <div
                  className="comparison-layer comparison-cold"
                  style={{
                    clipPath: `inset(0 ${100 - compareSplit}% 0 0)`,
                  }}
                >
                  <img
                    src={project.beforeImage}
                    alt={lang === 'ar' ? 'قبل الأشغال' : 'Avant travaux'}
                    className="comparison-img"
                    referrerPolicy="no-referrer"
                  />
                  <span className="comp-corner-tag comp-corner-left">
                    {lang === 'ar' ? 'قبل الأشغال' : 'Avant'}
                  </span>
                </div>
                <div
                  className="comparison-handle"
                  style={{
                    left: `clamp(22px, ${compareSplit}%, calc(100% - 22px))`,
                  }}
                >
                  <div className="handle-line" />
                  <div className="handle-knob">
                    <MoveHorizontal size={18} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="lightbox-stage">
                  <img
                    src={activePhoto.imageUrl}
                    alt={activePhoto.caption || project.title}
                    className="lightbox-main-img"
                    referrerPolicy="no-referrer"
                  />
                  {activePhoto.id && canManage && (
                    <button
                      type="button"
                      className="lightbox-delete-photo"
                      title={
                        lang === 'ar'
                          ? 'حذف هذه الصورة'
                          : 'Supprimer cette photo'
                      }
                      onClick={() => handleDeleteExtraPhoto(activePhoto.id!)}
                    >
                      <Trash2 size={15} />
                      <span>{lang === 'ar' ? 'حذف الصورة' : 'Supprimer'}</span>
                    </button>
                  )}
                </div>

                {activePhoto.caption && (
                  <p className="lightbox-photo-caption">
                    {activePhoto.caption}
                  </p>
                )}

                {allPhotos.length > 1 && (
                  <div className="lightbox-thumbs">
                    {allPhotos.map((item, idx) => (
                      <button
                        key={`${item.imageUrl.slice(0, 40)}-${idx}`}
                        type="button"
                        className={`lightbox-thumb-btn${
                          idx === safeIdx ? ' is-active' : ''
                        }`}
                        onClick={() => setActivePhotoIdx(idx)}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.caption || `${idx + 1}`}
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="lightbox-info-col">
            <h2 id="lightbox-title" className="lightbox-title">
              {project.title}
            </h2>
            <p className="lightbox-desc">{project.description}</p>

            <div className="lightbox-specs">
              <div className="spec-row">
                <span className="spec-key">
                  {lang === 'ar' ? 'التخصص' : 'Catégorie'}
                </span>
                <span className="spec-val">
                  {getCategoryLabel(project.category, lang)}
                </span>
              </div>
              <div className="spec-row">
                <span className="spec-key">
                  {lang === 'ar' ? 'الموقع' : 'Localisation'}
                </span>
                <span className="spec-val">{project.location}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">
                  {lang === 'ar' ? 'المساحة' : 'Surface'}
                </span>
                <span className="spec-val tabular-nums">{project.areaSqm}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">
                  {lang === 'ar' ? 'عدد الصور' : 'Photos'}
                </span>
                <span className="spec-val tabular-nums">{allPhotos.length}</span>
              </div>
              {project.specialties && project.specialties.length > 0 && (
                <div className="spec-row">
                  <span className="spec-key">
                    {lang === 'ar' ? 'التخصصات' : 'Lots'}
                  </span>
                  <span className="spec-val">
                    {project.specialties.join(' · ')}
                  </span>
                </div>
              )}
            </div>

            {project.completedServices &&
              project.completedServices.length > 0 && (
                <div className="completed-services-box">
                  <h3 className="form-label">
                    {lang === 'ar'
                      ? 'الخدمات والأعمال المنجزة في المشروع'
                      : 'Prestations réalisées sur ce chantier'}
                  </h3>
                  <ul className="service-bullet-list">
                    {project.completedServices.map((srv, idx) => (
                      <li key={idx}>{srv}</li>
                    ))}
                  </ul>
                </div>
              )}

            {canManage && (
              <div className="lightbox-manage-box">
                <div className="lightbox-add-photo">
                  <label className="form-label" htmlFor="extra-photo-caption">
                    {lang === 'ar'
                      ? 'إضافة صورة جديدة لهذا المشروع'
                      : 'Ajouter une photo au projet'}
                  </label>
                  <div className="extra-photo-controls">
                    <input
                      id="extra-photo-caption"
                      type="text"
                      className="form-input"
                      placeholder={
                        lang === 'ar'
                          ? 'وصف مختصر للصورة (اختياري)'
                          : 'Légende courte (optionnel)'
                      }
                      maxLength={200}
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                    />
                    <label className="btn btn-ghost btn-sm upload-label">
                      <Upload size={15} />
                      <span>
                        {addingPhoto
                          ? lang === 'ar'
                            ? 'جاري الرفع...'
                            : 'Envoi...'
                          : lang === 'ar'
                            ? 'رفع صورة'
                            : 'Importer'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={addingPhoto}
                        onChange={handleAddPhotoFile}
                      />
                    </label>
                  </div>
                  {photoError && <p className="form-error">{photoError}</p>}
                </div>

                <div className="lightbox-owner-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onEdit(project)}
                  >
                    <Pencil size={15} />
                    <span>
                      {lang === 'ar' ? 'تعديل المشروع' : 'Modifier'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => onDelete(project)}
                  >
                    <Trash2 size={15} />
                    <span>{lang === 'ar' ? 'حذف المشروع' : 'Supprimer'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
