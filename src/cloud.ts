import {createClient} from '@supabase/supabase-js';
import {type Project} from './model';
import {exportBundle,importBundle} from './bundle';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const cloud=url&&key?createClient(url,key):null;
export type RemoteProject={owner_id:string;id:string;product:string;process:string;revision:string;object_path:string;generation:number;updated_at:string};
export async function cloudList():Promise<RemoteProject[]>{
 if(!cloud)throw Error('Online úložisko ešte nie je nastavené.');
 const {data,error}=await cloud.from('navodky_projects').select('*').order('updated_at',{ascending:false});
 if(error)throw Error('Načítanie online návodiek zlyhalo. Overte pripojenie a nastavenie úložiska.');return data||[];
}
export async function cloudLoad(row:RemoteProject):Promise<Project>{
 if(!cloud)throw Error('Online úložisko nie je nastavené.');
 const {data,error}=await cloud.storage.from('navodky').download(row.object_path);
 if(error||!data)throw Error('Návodku sa nepodarilo stiahnuť. Obnovte zoznam a skúste znova.');
 const project=importBundle(new Uint8Array(await data.arrayBuffer()));
 if(project.id!==row.id)throw Error('Online projekt má neplatnú identitu.');return project;
}
export async function cloudSave(p:Project,expected:RemoteProject|null):Promise<RemoteProject>{
 if(!cloud)throw Error('Online úložisko nie je nastavené.');
 const {data:{user}}=await cloud.auth.getUser();if(!user)throw Error('Najprv sa prihláste.');
 if(expected&&expected.owner_id!==user.id)throw Error('Účet sa zmenil. Otvorte návodku z online zoznamu.');
 const bytes=exportBundle(p);if(bytes.length>50*1024*1024)throw Error('Online balík môže mať najviac 50 MB. Použite ZIP export alebo menšie fotografie.');
 const path=`${user.id}/${crypto.randomUUID()}.zip`;
 const {error:uploadError}=await cloud.storage.from('navodky').upload(path,bytes,{contentType:'application/zip',upsert:false});
 if(uploadError)throw Error('Odoslanie fotografií zlyhalo. Lokálna návodka zostáva uložená.');
 const payload={owner_id:user.id,id:p.id,product:p.product,process:p.process,revision:p.revision,object_path:path,generation:(expected?.generation||0)+1,updated_at:new Date().toISOString()};
 const query=expected?cloud.from('navodky_projects').update(payload).eq('owner_id',user.id).eq('id',p.id).eq('generation',expected.generation):cloud.from('navodky_projects').insert(payload);
 const {data,error}=await query.select().maybeSingle();
 if(error||!data){await cloud.storage.from('navodky').remove([path]);throw Error('Online verzia sa mohla zmeniť na inom počítači alebo uloženie zlyhalo. Exportujte miestne zmeny do ZIP, obnovte online zoznam a otvorte aktuálnu verziu.');}
 // Starší súbor ponecháme: otvorený dokument na inom zariadení ho môže práve sťahovať.
 return data as RemoteProject;
}
