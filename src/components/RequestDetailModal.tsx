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
import { MessageSquare, Save, Trash2, Upload, X } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  ProjectPhotoItem,
  ServiceRequestRecord,
} from '../data/showcaseDefaults';
import { AppLang, getCategoryLabel } from '../data/i18n';
import { uploadMediaImage } from '../utils/mediaStorage';

interface RequestDetailModalProps {
  request: ServiceRequestRecord | null;
  user: User | null;
  isAdmin: boolean;
  lang: AppLang;
  onClose: () => void;
  onDelete: (req: ServiceRequestRecord) => void;
  onContact: (req: ServiceRequestRecord, toTeam?: boolean) => void;
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
  const [adminNote, setAdminNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    setActiveIdx(0);
    setPhotoError('');
    setAdminNote(request?.adminNote || '');
    setNoteSaved(false);
  }, [request?.id, request?.adminNote]);

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

  const isOwner = !!user && user.emailVerified && request.ownerId === user.uid;
  const canManage = !!user && user.emailVerified && (isOwner || isAdmin);

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
    if (!isAdmin) return;
    const path = `requests/${request.id}`;
    await updateDoc(doc(db, 'requests', request.id), {
      status: nextStatus,
      adminNote: adminNote.trim().slice(0, 500),
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
    setNoteSaved(true);
  };

  const handleSaveNote = async () => {
    if (!isAdmin) return;
    const path = `requests/${request.id}`;
    await updateDoc(doc(db, 'requests', request.id), {
      status: request.status,
      adminNote: adminNote.trim().slice(0, 500),
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
    setNoteSaved(true);
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user || !canManage) return;

    setPhotoError('');
    setUploading(true);
    try {
      const uri = await uploadMediaImage(file, 'requests', user.uid);
      const photoId = `reqp_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const path = `requests/${request.id}/photos/${photoId}`;
      await setDoc(doc(db, 'requests', request.id, 'photos', photoId), {
        imageUrl: uri,
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
        ? 'قيد المراجعة'
        : 'À l’étude'
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
                  {lang === 'ar' ? 'التخصص المطلوب' : 'Spécialité'}
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

            {request.adminNote && (
              <div className="completed-services-box">
                <h3 className="form-label">
                  {lang === 'ar' ? 'ملاحظة فريق الإدارة' : 'Note de l’équipe'}
                </h3>
                <p className="lightbox-desc" style={{ margin: 0 }}>
                  {request.adminNote}
                </p>
              </div>
            )}

            {isAdmin && user && user.uid !== request.ownerId && (
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => onContact(request, false)}
              >
                <MessageSquare size={17} />
                <span>
                  {lang === 'ar'
                    ? 'مراسلة صاحب الطلب'
                    : 'Contacter le client'}
                </span>
              </button>
            )}

            {!isAdmin && isOwner && (
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => onContact(request, true)}
              >
                <MessageSquare size={17} />
                <span>
                  {lang === 'ar'
                    ? 'مراسلة الفريق بخصوص هذا الطلب'
                    : 'Écrire à l’équipe à propos de cette demande'}
                </span>
              </button>
            )}

            {canManage && (
              <div className="lightbox-manage-box">
                {isAdmin && (
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
                          void handleStatusChange(
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
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="req-admin-note">
                        {lang === 'ar'
                          ? 'ملاحظة الإدارة للزبون'
                          : 'Note admin pour le client'}
                      </label>
                      <div className="url-inline">
                        <input
                          id="req-admin-note"
                          type="text"
                          className="form-input"
                          maxLength={500}
                          value={adminNote}
                          onChange={(e) => {
                            setAdminNote(e.target.value);
                            setNoteSaved(false);
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => void handleSaveNote()}
                        >
                          <Save size={14} />
                        </button>
                      </div>
                      {noteSaved && (
                        <p className="form-success">
                          {lang === 'ar'
                            ? 'تم حفظ التحديث.'
                            : 'Mise à jour enregistrée.'}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {(request.status === 'open' || isAdmin) && (
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
