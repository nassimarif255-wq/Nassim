import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function formatFirebaseError(
  error: unknown,
  lang: 'ar' | 'fr' = 'ar'
): string {
  const raw = error instanceof Error ? error.message : String(error || '');
  let inner = raw;
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed && typeof parsed.error === 'string') {
      inner = parsed.error;
    }
  } catch {
    // Plain error message
  }
  const lower = inner.toLowerCase();
  if (lower.includes('permission') || lower.includes('insufficient')) {
    return lang === 'ar'
      ? 'ليس لديك صلاحية تنفيذ هذا الإجراء أو أن الجلسة غير مصرح لها. تأكد من تسجيل الدخول بالحساب الصحيح.'
      : 'Permissions insuffisantes pour cette action. Vérifiez votre compte connecté.';
  }
  if (lower.includes('offline') || lower.includes('network')) {
    return lang === 'ar'
      ? 'تعذر الاتصال بقاعدة البيانات. تحقق من اتصال الإنترنت وحاول مجدداً.'
      : 'Connexion impossible. Vérifiez votre réseau et réessayez.';
  }
  if (lower.includes('popup-closed-by-user')) {
    return lang === 'ar'
      ? 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.'
      : 'La fenêtre de connexion a été fermée avant la fin.';
  }
  return (
    inner ||
    (lang === 'ar'
      ? 'حدث خطأ غير متوقع أثناء حفظ البيانات.'
      : 'Une erreur est survenue lors de l’enregistrement.')
  );
}

export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
