import Compressor from "compressorjs";

export const compressImage = async (file, options = {}) => {
    const defaultOptions = {
        quality: 0.8,
        maxWidth: 1080,
        maxHeight: 1080,
    };

    const compressionOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
        new Compressor(file, {
            ...compressionOptions,
            success(result) {
                resolve(result);
            },
            error(err) {
                reject(err);
            }
        });
    });
}; 