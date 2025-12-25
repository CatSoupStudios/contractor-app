const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const uploadToCloudinary = async (imageUri: string) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) return null;

  const data = new FormData();

  // Si es base64 (como la firma)
  if (imageUri.startsWith('data:image')) {
    data.append("file", imageUri);
  } else {
    // Si es un URI de archivo local
    const fileExtension = imageUri.split('.').pop();
    const file: any = {
      uri: imageUri,
      type: `image/${fileExtension}`,
      name: `upload.${fileExtension}`,
    };
    data.append("file", file);
  }

  data.append("upload_preset", UPLOAD_PRESET);
  data.append("cloud_name", CLOUD_NAME);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const result = await response.json();

    if (result.secure_url) {
      // Aplicamos la optimización automática
      return result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
    }

    return null;
  } catch (error) {
    console.error("Error en el upload:", error);
    return null;
  }
};

export const getOptimizedImageUrl = (url?: string, width = 600) => {
  if (!url) return '';
  if (!url.includes('cloudinary')) return url;
  // Prevent double optimization
  if (url.includes('f_auto,q_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};