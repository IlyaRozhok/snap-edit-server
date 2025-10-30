import { SnapEditClient } from './snapedit-client.service';
export declare class SnapEditController {
    private readonly client;
    constructor(client: SnapEditClient);
    autoSuggest(file: Express.Multer.File, sessionId?: string): Promise<any>;
    erase(files: Array<Express.Multer.File>, body: any): Promise<any>;
    save(sessionId: string): Promise<any>;
    enhance(file: Express.Multer.File, quality?: 'fine' | 'ultra'): Promise<any>;
    removeBg(file: Express.Multer.File): Promise<any>;
}
