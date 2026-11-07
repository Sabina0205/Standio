import {it,expect} from 'vitest';
import {newProject,createRevision,parseProject} from './model';
import {exportBundle,importBundle} from './bundle';
it('spodné pásy oboch strán a počet bodov zostanú v zálohe a novej revízii',()=>{const p=newProject();expect(p.pointsPerPage).toBeUndefined();expect(p.bottomBlocks?.[0].length).toBeGreaterThan(0);expect(p.bottomBlocks?.[1].length).toBeGreaterThan(0);p.bottomPageOne='data:image/png;base64,AQIDBA==';p.pointsPerPage=5;const copy=importBundle(exportBundle(p));expect(copy).toEqual(p);expect(createRevision(copy,'02').bottomPageOne).toBe(p.bottomPageOne);expect(()=>parseProject(JSON.stringify({...p,pointsPerPage:8}))).toThrow('1 až 7');});
