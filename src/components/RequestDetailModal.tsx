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
  updateDoc,
} from 'firebase/firestore';
import { X, Upload, Trash2, MessageSquare } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  ProjectPhotoItem,
  ServiceRequestRecord,
} from '../data/showcaseDefaults';
import { AppLang, getCategoryLabel } from '../data/i18n';
import { compressImageFile } from '../utils/imageProcessor';

interface RequestDetailModalProps {
  request: ServiceRequestRecord | null;
  user: User | null;
  isAdmin: boolean;
  lang: AppLang;
  onClose: () => void;
  onDelete: (req: ServiceRequestRecord) => void;
  onContact: (req: ServiceRequestRecord) => void;
}

export function RequestDetailModal({
  request,
  user,
  isAdmin,
  lang,
  onClose,
  onDelete,
  onContact,
}: RequestDetailModalProps) {
  const [photos, setPhotos] = useState<ProjectPhotoItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    setActiveIdx(0);
    setPhotoError('');
  }, [request?.id]);

  useEffect(() => {
    if (!request) {
      setPhotos([]);
      return;
    }

    const photosPath = `requests/${request.id}/photos`;
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
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [request, onClose]);

  if (!request) return null;

  const canManage =
    !!user &&
    user.emailVerified &&
    (request.ownerId === user.uid || isAdmin);

  const allPhotos: { id?: string; imageUrl: string; caption: string }[] = [
    ...(request.coverImage
      ? [{ imageUrl: request.coverImage, caption: request.title }]
      : []),
    ...photos.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      caption: p.caption,
    })),
  ];

  const safeIdx = activeIdx < allPhotos.length ? activeIdx : 0;

  const handleStatusChange = async (
    nextStatus: 'open' | 'in_progress' | 'closed'
  ) => {
    if (!canManage) return;
    const path = `requests/${request.id}`;
    await updateDoc(doc(db, 'requests', request.id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    setPhotoError('');
    setUploading(true);
    try {
      const compressed = await compressImageFile(file);
      const photoId = `reqp_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const path = `requests/${request.id}/photos/${photoId}`;
      await setDoc(doc(db, 'requests', request.id, 'photos', photoId), {
        imageUrl: compressed,
        caption: request.title,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, path)
      );
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : 'تعذر رفع الصورة.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const path = `requests/${request.id}/photos/${photoId}`;
    await deleteDoc(doc(db, 'requests', request.id, 'photos', photoId)).catch(
      (err) => handleFirestoreError(err, OperationType.DELETE, path)
    );
    setActiveIdx(0);
  };

  const statusLabel =
    request.status === 'open'
      ? lang === 'ar'
        ? 'مفتوح'
        : 'Ouvert'
      : request.status === 'in_progress'
        ? lang === 'ar'
          ? 'قيد التنفيذ'
          : 'En cours'
        : lang === 'ar'
          ? 'مكتمل'
          : 'Clôturé';

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="req-modal-title"
      onClick={onClose}
    >
      <div className="lightbox-shell" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-top">
          <div className="lightbox-meta-line">
            <span>{getCategoryLabel(request.category, lang)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {request.wilaya} - {request.commune}
            </span>
            <span aria-hidden="true">·</span>
            <span>{statusLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{request.ownerName}</span>
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
            {allPhotos.length === 0 ? (
              <div className="gallery-empty">
                <p>
                  {lang === 'ar'
                    ? 'لم يتم إرفاق صور مع هذا الطلب.'
                    : 'Aucune photo jointe à cette demande.'}
                </p>
              </div>
            ) : (
              <>
                <div className="lightbox-stage">
                  <img
                    src={allPhotos[safeIdx].imageUrl}
                    alt={request.title}
                    className="lightbox-main-img"
                    referrerPolicy="no-referrer"
                  />
                  {allPhotos[safeIdx].id && canManage && (
                    <button
                      type="button"
                      className="lightbox-delete-photo"
                      onClick={() => handleDeletePhoto(allPhotos[safeIdx].id!)}
                    >
                      <Trash2 size={14} />
                      <span>{lang === 'ar' ? 'حذف' : 'Supprimer'}</span>
                    </button>
                  )}
                </div>
                {allPhotos.length > 1 && (
                  <div className="lightbox-thumbs">
                    {allPhotos.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`lightbox-thumb-btn${
                          idx === safeIdx ? ' is-active' : ''
                        }`}
                        onClick={() => setActiveIdx(idx)}
                      >
                        <img
                          src={item.imageUrl}
                          alt={request.title}
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
            <h2 id="req-modal-title" className="lightbox-title">
              {request.title}
            </h2>
            <p className="lightbox-desc">{request.description}</p>

            <div className="lightbox-specs">
              <div className="spec-row">
                <span className="spec-key">
                  {lang === 'ar' ? 'المهنة المطلوبة' : 'Métier'}
                </span>
                <span className="spec-val">
                  {getCategoryLabel(request.category, lang)}
                </span>
              </div>
              <div className="spec-row">
                <span className="spec-key">
                  {lang === 'ar' ? 'الولاية والبلدية' : 'Zone'}
                </span>
                <span className="spec-val">
                  {request.wilaya} - {request.commune}
                </span>
              </div>
              <div className="spec-row">
                <span className="spec-key">
                  {lang === 'ar' ? 'الحالة' : 'Statut'}
                </span>
                <span className="spec-val">{statusLabel}</span>
              </div>
            </div>

            {(!user || user.uid !== request.ownerId) &&
              request.status !== 'closed' && (
                <button
                  type="button"
                  className="btn btn-primary btn-full"
                  onClick={() => onContact(request)}
                >
                  <MessageSquare size={17} />
                  <span>
                    {lang === 'ar'
                      ? 'تواصل مع الزبون وقدّم عرضك'
                      : 'Contacter le client et proposer un devis'}
                  </span>
                </button>
              )}

            {canManage && (
              <div className="lightbox-manage-box">
                {(request.status !== 'closed' || isAdmin) && (
                  <>
                    <div className="form-field">
                      <label className="form-label" htmlFor="req-status-sel">
                        {lang === 'ar' ? 'تحديث حالة الطلب' : 'Statut de la demande'}
                      </label>
                      <select
                        id="req-status-sel"
                        className="form-input"
                        value={request.status}
                        onChange={(e) =>
                          handleStatusChange(
                            e.target.value as 'open' | 'in_progress' | 'closed'
                          )
                        }
                      >
                        <option value="open">
                          {lang === 'ar' ? 'مفتوح' : 'Ouvert'}
                        </option>
                        <option value="in_progress">
                          {lang === 'ar' ? 'قيد التنفيذ' : 'En cours'}
                        </option>
                        <option value="closed">
                          {lang === 'ar' ? 'مكتمل / مغلق' : 'Clôturé'}
                        </option>
                      </select>
                    </div>

                    <div className="lightbox-add-photo">
                      <label className="btn btn-ghost btn-sm upload-label">
                        <Upload size={15} />
                        <span>
                          {uploading
                            ? lang === 'ar'
                              ? 'جاري الرفع...'
                              : 'Envoi...'
                            : lang === 'ar'
                              ? 'إرفاق صورة إضافية للمشكلة'
                              : 'Joindre une photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          disabled={uploading}
                          onChange={handleAddPhoto}
                        />
                      </label>
                      {photoError && <p className="form-error">{photoError}</p>}
                    </div>
                  </>
                )}

                <div className="lightbox-owner-actions">
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => onDelete(request)}
                  >
                    <Trash2 size={15} />
                    <span>{lang === 'ar' ? 'حذف الطلب' : 'Supprimer'}</span>
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
