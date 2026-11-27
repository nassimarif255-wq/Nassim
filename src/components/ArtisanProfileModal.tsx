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
import { X, Upload, Trash2, Pencil, MessageSquare } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  ArtisanRecord,
  ProjectPhotoItem,
  ProjectRecord,
} from '../data/showcaseDefaults';
import { AppLang, getCategoryLabel } from '../data/i18n';
import { compressImageFile } from '../utils/imageProcessor';

interface ArtisanProfileModalProps {
  artisan: ArtisanRecord | null;
  linkedProjects: ProjectRecord[];
  user: User | null;
  isAdmin: boolean;
  lang: AppLang;
  onClose: () => void;
  onEdit: (artisan: ArtisanRecord) => void;
  onDelete: (artisan: ArtisanRecord) => void;
  onContact: (artisan: ArtisanRecord) => void;
  onOpenProject: (project: ProjectRecord) => void;
}

export function ArtisanProfileModal({
  artisan,
  linkedProjects,
  user,
  isAdmin,
  lang,
  onClose,
  onEdit,
  onDelete,
  onContact,
  onOpenProject,
}: ArtisanProfileModalProps) {
  const [photos, setPhotos] = useState<ProjectPhotoItem[]>([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    if (!artisan) {
      setPhotos([]);
      return;
    }

    const photosPath = `artisans/${artisan.id}/photos`;
    const q = query(collection(db, photosPath), orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPhotos(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              imageUrl: String(data.imageUrl || ''),
              caption: String(data.caption || ''),
              ownerId: String(data.ownerId || ''),
            };
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, photosPath)
    );

    return () => unsub();
  }, [artisan]);

  useEffect(() => {
    if (!artisan) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [artisan, onClose]);

  if (!artisan) return null;

  const canManage =
    !!user &&
    user.emailVerified &&
    (artisan.ownerId === user.uid || isAdmin);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    setPhotoError('');
    setUploading(true);
    try {
      const compressed = await compressImageFile(file);
      const photoId = `artp_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const path = `artisans/${artisan.id}/photos/${photoId}`;
      await setDoc(doc(db, 'artisans', artisan.id, 'photos', photoId), {
        imageUrl: compressed,
        caption: caption.trim().slice(0, 200) || artisan.displayName,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, path)
      );
      setCaption('');
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : 'تعذر رفع الصورة.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const path = `artisans/${artisan.id}/photos/${photoId}`;
    await deleteDoc(doc(db, 'artisans', artisan.id, 'photos', photoId)).catch(
      (err) => handleFirestoreError(err, OperationType.DELETE, path)
    );
  };

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="artisan-modal-title"
      onClick={onClose}
    >
      <div className="lightbox-shell" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-top">
          <div className="lightbox-meta-line">
            <span>{getCategoryLabel(artisan.profession, lang)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {artisan.wilaya} - {artisan.commune}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {artisan.experienceYears}{' '}
              {lang === 'ar' ? 'سنة خبرة' : 'ans d’expérience'}
            </span>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label={lang === 'ar' ? 'إغلاق' : 'Fermer'}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="lightbox-body">
          <div className="lightbox-media-col">
            <h3 className="form-heading">
              {lang === 'ar' ? 'معرض صور أعمال الحرفي' : 'Photos des réalisations'}
            </h3>

            {photos.length === 0 ? (
              <div className="gallery-empty">
                <p>
                  {lang === 'ar'
                    ? 'لم يضف الحرفي صوراً داخل الملف الشخصي بعد.'
                    : 'Aucune photo ajoutée sur ce profil pour le moment.'}
                </p>
              </div>
            ) : (
              <div className="artisan-photos-grid">
                {photos.map((p) => (
                  <div key={p.id} className="artisan-photo-item">
                    <img
                      src={p.imageUrl}
                      alt={p.caption || artisan.displayName}
                      referrerPolicy="no-referrer"
                    />
                    {canManage && (
                      <button
                        type="button"
                        className="lightbox-delete-photo"
                        onClick={() => handleDeletePhoto(p.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {p.caption && (
                      <span className="artisan-photo-cap">{p.caption}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {linkedProjects.length > 0 && (
              <div className="linked-works-box">
                <h4 className="form-label">
                  {lang === 'ar'
                    ? `المشاريع المنشورة (${linkedProjects.length})`
                    : `Projets publiés (${linkedProjects.length})`}
                </h4>
                <div className="linked-works-row">
                  {linkedProjects.map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      className="linked-work-btn"
                      onClick={() => onOpenProject(proj)}
                    >
                      <img
                        src={proj.coverImage}
                        alt={proj.title}
                        referrerPolicy="no-referrer"
                      />
                      <span>{proj.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lightbox-info-col">
            <div className="artisan-modal-head">
              {artisan.avatarUrl ? (
                <img
                  src={artisan.avatarUrl}
                  alt={artisan.displayName}
                  className="artisan-avatar-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="artisan-avatar-lg-fallback">
                  {artisan.displayName.charAt(0)}
                </div>
              )}
              <div>
                <h2 id="artisan-modal-title" className="lightbox-title">
                  {artisan.displayName}
                </h2>
                <p className="project-meta-line">
                  {getCategoryLabel(artisan.profession, lang)} ·{' '}
                  {artisan.wilaya}
                </p>
              </div>
            </div>

            <p className="lightbox-desc">{artisan.bio}</p>

            <div className="lightbox-specs">
              <div className="spec-row">
                <span className="spec-key">
                  {lang === 'ar' ? 'الولاية' : 'Wilaya'}
                </span>
                <span className="spec-val">{artisan.wilaya}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">
                  {lang === 'ar' ? 'البلدية' : 'Commune'}
                </span>
                <span className="spec-val">{artisan.commune}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">
                  {lang === 'ar' ? 'الخبرة' : 'Expérience'}
                </span>
                <span className="spec-val tabular-nums">
                  {artisan.experienceYears}{' '}
                  {lang === 'ar' ? 'سنة' : 'ans'}
                </span>
              </div>
            </div>

            {(!user || user.uid !== artisan.ownerId) && (
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => onContact(artisan)}
              >
                <MessageSquare size={17} />
                <span>
                  {lang === 'ar'
                    ? 'تواصل مع المهني واطلب تسعيرة'
                    : 'Contacter et demander un devis'}
                </span>
              </button>
            )}

            {canManage && (
              <div className="lightbox-manage-box">
                <div className="lightbox-add-photo">
                  <label className="form-label" htmlFor="art-photo-cap">
                    {lang === 'ar'
                      ? 'إضافة صورة عمل لملفي الشخصي'
                      : 'Ajouter une photo à mon profil'}
                  </label>
                  <div className="extra-photo-controls">
                    <input
                      id="art-photo-cap"
                      type="text"
                      className="form-input"
                      placeholder={
                        lang === 'ar'
                          ? 'وصف الصورة (اختياري)'
                          : 'Légende (optionnel)'
                      }
                      maxLength={200}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                    />
                    <label className="btn btn-ghost btn-sm upload-label">
                      <Upload size={15} />
                      <span>
                        {uploading
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
                        disabled={uploading}
                        onChange={handleUploadPhoto}
                      />
                    </label>
                  </div>
                  {photoError && <p className="form-error">{photoError}</p>}
                </div>

                <div className="lightbox-owner-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onEdit(artisan)}
                  >
                    <Pencil size={15} />
                    <span>{lang === 'ar' ? 'تعديل الملف' : 'Modifier'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => onDelete(artisan)}
                  >
                    <Trash2 size={15} />
                    <span>{lang === 'ar' ? 'حذف الملف' : 'Supprimer'}</span>
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
