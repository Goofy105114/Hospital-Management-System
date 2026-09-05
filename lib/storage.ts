import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const storage = {
  async uploadFile(base64Data: string, folder = 'clinical_documents') {
    if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY.startsWith('sample')) {
      // Mock upload for local development
      return {
        url: `https://res.cloudinary.com/demo/image/upload/mock-${Date.now()}.pdf`,
        publicId: `mock_doc_${Date.now()}`,
      };
    }

    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `going_merry_hms/${folder}`,
      resource_type: 'auto',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  },
};
