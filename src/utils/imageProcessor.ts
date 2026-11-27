// Compress uploaded image files on an offscreen canvas so they stay sharp and lightweight (<= 300 KB)

async function loadBitmap(file: File): Promise<{
  canvas: HTMLCanvasElement;
}> {
  if (!file.type.startsWith('image/')) {
    throw new Error('الملف المختار ليس صورة صالحة.');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('حجم الصورة الأصلي يتجاوز 15 ميغابايت.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('الملف المختار ليس صورة صالحة.'));
      img.onload = () => {
        const maxWidth = 1280;
        const scale = Math.min(1, maxWidth / img.width);
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذر تهيئة معالج الصور.'));
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve({ canvas });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function compressImageFile(
  file: File,
  _maxWidth = 1280,
  quality = 0.8
): Promise<string> {
  const { canvas } = await loadBitmap(file);
  let q = quality;
  let dataUrl = canvas.toDataURL('image/jpeg', q);
  while (dataUrl.length > 290000 && q > 0.42) {
    q -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', q);
  }
  if (dataUrl.length > 340000) {
    throw new Error('حجم الصورة كبير جداً بعد الضغط، يرجى اختيار صورة أصغر.');
  }
  return dataUrl;
}

export async function compressImageToBlob(
  file: File,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string }> {
  const { canvas } = await loadBitmap(file);
  const dataUrl = await (async () => {
    let q = quality;
    let url = canvas.toDataURL('image/jpeg', q);
    while (url.length > 290000 && q > 0.42) {
      q -= 0.1;
      url = canvas.toDataURL('image/jpeg', q);
    }
    return url;
  })();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('تعذر تحويل الصورة.'));
      },
      'image/jpeg',
      0.82
    );
  });

  return { blob, dataUrl };
}
