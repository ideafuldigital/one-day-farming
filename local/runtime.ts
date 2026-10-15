import {database,bucket,ownerEmail} from './core.mjs';
export const env={DB:database as unknown as D1Database,BUCKET:bucket as unknown as R2Bucket,get ADMIN_OWNER_EMAIL(){return ownerEmail() as string|undefined;}};
