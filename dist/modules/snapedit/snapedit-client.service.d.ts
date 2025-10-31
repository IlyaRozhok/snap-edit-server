export declare class SnapEditClient {
    private readonly baseUrl;
    private readonly apiKey;
    constructor();
    private getHeaders;
    autoSuggest(image: Buffer, sessionId?: string): Promise<any>;
    erase(image: Buffer, maskBrush: Buffer, sessionId?: string, maskBase?: Buffer): Promise<any>;
    save(image: Buffer, sessionId: string, previewMaskToSave: string, previewImageToSave: string, originalLargeImage: string): Promise<any>;
    enhance(image: Buffer, quality: 'fine' | 'ultra'): Promise<any>;
    removeBg(image: Buffer): Promise<any>;
}
