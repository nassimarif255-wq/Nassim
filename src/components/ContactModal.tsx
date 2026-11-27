import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { X, Send, LogIn } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { AppLang } from '../data/i18n';

export interface ContactTarget {
  recipientOwnerId: string;
  recipientName: string;
  contextType: 'artisan' | 'request';
  contextId: string;
  contextTitle: string;
}

interface ContactModalProps {
  target: ContactTarget | null;
  user: User | null;
  lang: AppLang;
  onClose: () => void;
  onSignIn: () => Promise<void>;
}

export function ContactModal({
  target,
  user,
  lang,
  onClose,
  onSignIn,
}: ContactModalProps) {
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sentOk, setSentOk] = useState(false);

  useEffect(() => {
    setMessage('');
    setContactInfo('');
    setErrorMsg('');
    setSentOk(false);
  }, [target?.contextId, target?.recipientOwnerId]);

  useEffect(() => {
    if (!target) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [target, onClose]);

  if (!target) return null;

  const isSelf = !!user && user.uid === target.recipientOwnerId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!user.emailVerified) {
      setErrorMsg(
        lang === 'ar'
          ? 'يجب أن يكون البريد الإلكتروني للحساب مفعلاً.'
          : 'Votre e-mail doit être vérifié.'
      );
      return;
    }
    if (isSelf) {
      setErrorMsg(
        lang === 'ar'
          ? 'لا يمكنك إرسال رسالة إلى حسابك الشخصي.'
          : 'Vous ne pouvez pas envoyer un message à votre propre compte.'
      );
      return;
    }

    const cleanMsg = message.trim();
    if (cleanMsg.length < 5 || cleanMsg.length > 1000) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى كتابة رسالة واضحة (5 أحرف على الأقل).'
          : 'Veuillez saisir un message d’au moins 5 caractères.'
      );
      return;
    }

    setErrorMsg('');
    setSending(true);
    try {
      const inquiryId = `inq_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const path = `inquiries/${inquiryId}`;

      await setDoc(doc(db, 'inquiries', inquiryId), {
        senderId: user.uid,
        senderName: (user.displayName || 'مستخدم').slice(0, 100),
        recipientOwnerId: target.recipientOwnerId,
        recipientName: target.recipientName.slice(0, 100),
        contextType: target.contextType,
        contextId: target.contextId,
        contextTitle: target.contextTitle.slice(0, 120),
        message: cleanMsg,
        contactInfo: contactInfo.trim().slice(0, 120),
        replyText: '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, path)
      );

      setSentOk(true);
      setMessage('');
      setContactInfo('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : lang === 'ar'
            ? 'تعذر إرسال الرسالة، حاول مجدداً.'
            : 'Échec de l’envoi du message.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      onClick={onClose}
    >
      <div
        className="modal-card-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lightbox-top">
          <h2 id="contact-modal-title" className="drawer-title">
            {lang === 'ar'
              ? `تواصل مباشر مع ${target.recipientName}`
              : `Contacter ${target.recipientName}`}
          </h2>
          <button
            type="button"
            className="icon-btn"
            aria-label={lang === 'ar' ? 'إغلاق' : 'Fermer'}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-card-body">
          <p className="modal-context-line">
            {lang === 'ar' ? 'الموضوع:' : 'Objet :'} {target.contextTitle}
          </p>

          {!user ? (
            <div className="auth-gate">
              <p>
                {lang === 'ar'
                  ? 'لحماية خصوصية الزبائن والمهنيين، يرجى تسجيل الدخول بحساب Google لإرسال رسالة مباشرة.'
                  : 'Pour protéger la confidentialité, connectez-vous avec Google pour envoyer un message direct.'}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={onSignIn}
              >
                <LogIn size={17} />
                <span>
                  {lang === 'ar'
                    ? 'تسجيل الدخول بحساب Google'
                    : 'Se connecter avec Google'}
                </span>
              </button>
            </div>
          ) : sentOk ? (
            <div className="auth-gate">
              <p className="form-success">
                {lang === 'ar'
                  ? 'تم إرسال رسالتك بنجاح! سيصلك الرد في تبويب "الرسائل" داخل حسابك.'
                  : 'Message envoyé avec succès ! Retrouvez les réponses dans votre onglet Messages.'}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onClose}
              >
                {lang === 'ar' ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          ) : (
            <form className="project-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label" htmlFor="inq-message">
                  {lang === 'ar' ? 'نص الرسالة أو العرض' : 'Votre message ou proposition'}
                </label>
                <textarea
                  id="inq-message"
                  className="form-input form-textarea"
                  rows={4}
                  maxLength={1000}
                  required
                  placeholder={
                    lang === 'ar'
                      ? 'اشرح تفاصيل العمل المطلوب، الموعد المقترح أو التسعير التقديري...'
                      : 'Décrivez votre besoin, disponibilité ou proposition de devis...'
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="inq-phone">
                  {lang === 'ar'
                    ? 'وسيلة تواصل إضافية (رقم هاتف / واتساب - يظهر للمستلم فقط)'
                    : 'Téléphone / WhatsApp (visible uniquement par le destinataire)'}
                </label>
                <input
                  id="inq-phone"
                  type="text"
                  className="form-input"
                  maxLength={120}
                  placeholder="0550 00 00 00"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>

              {errorMsg && <p className="form-error">{errorMsg}</p>}

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={sending || isSelf}
              >
                <Send size={16} />
                <span>
                  {sending
                    ? lang === 'ar'
                      ? 'جاري الإرسال...'
                      : 'Envoi...'
                    : lang === 'ar'
                      ? 'إرسال الرسالة'
                      : 'Envoyer le message'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
