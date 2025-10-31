export declare function validateImage(buffer: Buffer, mime: string, maxSizeMB?: number): Promise<void>;
export declare function convertHeicToJpeg(buffer: Buffer): Promise<Buffer>;
export declare function resizeByLongestSide(buffer: Buffer, maxSide: number): Promise<Buffer>;
export interface ProcessImageOptions {
    maxSize: number;
}
export declare const processImage: (buffer: Buffer, options: ProcessImageOptions) => Promise<Buffer>;
