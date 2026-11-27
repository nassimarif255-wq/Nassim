// Compress uploaded image files on an offscreen canvas so they stay crisp (< 350 KB) and safe for Firestore
export async function compressImageFile(
  file: File,
  maxWidth = 1280,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('الملف المختار ليس صورة صالحة.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const targetW = Math.round(img.width * scale);
        const targetH = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذر تهيئة معالج الصور.'));
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);

        let q = quality;
        let dataUrl = canvas.toDataURL('image/jpeg', q);
        while (dataUrl.length > 380000 && q > 0.45) {
          q -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', q);
        }
        if (dataUrl.length > 440000) {
          reject(
            new Error(
              'حجم الصورة كبير جداً بعد الضغط، يرجى اختيار صورة أصغر.'
            )
          );
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
