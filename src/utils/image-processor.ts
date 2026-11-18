/**
 * DESKOUNTA ERP - UTILIDADES DE PROCESAMIENTO Y COMPRESIÓN DE IMÁGENES
 * Inspirado en el motor de optimización de SoccerAdminEC.
 * Convierte formatos pesados a WebP ultra ligero en el navegador antes de subir.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0 (default 0.85)
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Convierte y comprime un archivo o Blob de imagen a formato WebP ligero en el cliente.
 */
export async function compressImageToWebP(
  fileOrBlob: File | Blob,
  options: CompressionOptions = {}
): Promise<{ file: File; previewUrl: string; sizeBytes: number; originalName: string }> {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.85,
    format = 'image/webp',
  } = options;

  const originalName =
    fileOrBlob instanceof File
      ? fileOrBlob.name.replace(/\.[^/.]+$/, '')
      : 'image';

  // Si es un SVG vectorial, no se rasteriza para mantener calidad
  if (fileOrBlob.type === 'image/svg+xml') {
    const previewUrl = URL.createObjectURL(fileOrBlob);
    const finalFile =
      fileOrBlob instanceof File
        ? fileOrBlob
        : new File([fileOrBlob], `${originalName}.svg`, { type: 'image/svg+xml' });
    return {
      file: finalFile,
      previewUrl,
      sizeBytes: fileOrBlob.size,
      originalName,
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileOrBlob);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo la proporción
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el Canvas 2D'));
          return;
        }

        // Suavizado de bordes para alta definición
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al generar blob comprimido'));
              return;
            }

            const extension = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
            const newFile = new File([blob], `${originalName}.${extension}`, {
              type: format,
            });
            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: newFile,
              previewUrl,
              sizeBytes: blob.size,
              originalName,
            });
          },
          format,
          quality
        );
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
  });
}

/**
 * Crea un Blob recortado a partir de una imagen y coordenadas exactas.
 */
export async function createCroppedImage(
  imageSrc: string,
  pixelCrop: CropArea,
  rotation = 0,
  format: 'image/webp' | 'image/png' | 'image/jpeg' = 'image/webp',
  quality = 0.9
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No se pudo inicializar el Canvas 2D');
  }

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = calculateRotatedBox(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Canvas con el recorte exacto
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('No se pudo inicializar el Canvas recortado');
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.imageSmoothingEnabled = true;
  croppedCtx.imageSmoothingQuality = 'high';

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Error al generar el Blob recortado'));
          return;
        }
        resolve(blob);
      },
      format,
      quality
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

function calculateRotatedBox(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Formatea bytes a KB o MB legibles
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
