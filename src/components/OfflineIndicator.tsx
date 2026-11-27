import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type { AppLang } from '../data/i18n';

export function OfflineIndicator({ lang }: { lang: AppLang }) {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="offline-toast" role="status" aria-live="polite">
      <WifiOff size={15} />
      <span>
        {lang === 'ar'
          ? 'وضع عدم الاتصال — يتم عرض البيانات المحفوظة محلياً.'
          : 'Mode hors ligne — affichage des données en cache.'}
      </span>
    </div>
  );
}
