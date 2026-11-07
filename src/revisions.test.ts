import 'fake-indexeddb/auto';
import {it,expect} from 'vitest';
import {newProject,saveProject,listProjects,commitRevision,removeProject,restoreLibrary} from './model';
it('uzamkne originál, odmietne zmeny aj zmazanie a obnoví históriu zo zálohy',async()=>{
 const p=newProject(); await saveProject(p);
 const next=await commitRevision(p,'02','Zmena kontroly');
 expect(next.locked).toBe(false);
 const old=(await listProjects()).find(x=>x.id===p.id)!;
 expect(old.locked).toBe(true);
 await expect(saveProject({...old,process:'Zmenené'})).rejects.toThrow('Uzamknutú');
 await expect(removeProject(old.id)).rejects.toThrow('Uzamknutú');
 await expect(commitRevision(old,'02','')).rejects.toThrow('už existuje');
 await restoreLibrary(JSON.stringify({format:'navodky-backup-1',projects:[old,next]}));
 const all=await listProjects();const copy=all.find(x=>x.id!==next.id&&x.parentRevisionId&&x.revision==='02')!;
 expect(copy.parentRevisionId).not.toBe(old.id);
 expect(all.find(x=>x.id===copy.parentRevisionId)?.locked).toBe(true);
});
