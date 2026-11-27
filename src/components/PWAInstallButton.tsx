import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { AppLang } from '../data/i18n';

interface PWAInstallButtonProps {
  lang: AppLang;
  variant?: 'hero' | 'footer';
}

export function PWAInstallButton({
  lang,
  variant = 'hero',
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={
          variant === 'footer'
            ? 'theme-switch-btn'
            : 'btn btn-ghost'
        }
      >
        <Download size={variant === 'footer' ? 14 : 16} />
        <span>
          {lang === 'ar' ? 'تثبيت التطبيق' : 'Installer l’app'}
        </span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className={
          variant === 'footer'
            ? 'theme-switch-btn'
            : 'btn btn-ghost'
        }
      >
        <Smartphone size={variant === 'footer' ? 14 : 16} />
        <span>
          {lang === 'ar' ? 'تثبيت على الهاتف' : 'Installer sur mobile'}
        </span>
      </button>

      {showGuide && (
        <div
          className="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="modal-card-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox-top">
              <h2 id="pwa-guide-title" className="drawer-title">
                {lang === 'ar'
                  ? 'تثبيت تطبيق اخدم دارك'
                  : 'Installer DZ Darkom Pro'}
              </h2>
              <button
                type="button"
                className="icon-btn"
                aria-label={lang === 'ar' ? 'إغلاق' : 'Fermer'}
                onClick={() => setShowGuide(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-card-body">
              {isIOS ? (
                <p className="inquiry-body">
                  {lang === 'ar'
                    ? '1. اضغط على زر المشاركة (Share) في شريط سفاري. 2. اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
                    : '1. Appuyez sur le bouton Partager dans Safari. 2. Sélectionnez « Sur l’écran d’accueil ».'}
                </p>
              ) : (
                <p className="inquiry-body">
                  {lang === 'ar'
                    ? 'افتح قائمة المتصفح (⋮) واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية" للعمل السريع وتصفح الأعمال حتى عند ضعف الاتصال.'
                    : 'Ouvrez le menu du navigateur (⋮) puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».'}
                </p>
              )}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowGuide(false)}
              >
                {lang === 'ar' ? 'حسناً' : 'Compris'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
