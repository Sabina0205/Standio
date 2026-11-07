import {it,expect} from 'vitest';
import {newProject,parseProject,createRevision,uid} from './model';
import {projectCsv,importCsv,exportBundle,importBundle} from './bundle';
it('vlastný názov je nezávislý od procesu a zostáva v zálohe, CSV a revízii',()=>{const p=newProject();p.title='Kontrolný štandard ventilátora';p.process='Výstupná kontrola';expect(importBundle(exportBundle(p))).toEqual(p);expect(importCsv(projectCsv(p)).title).toBe(p.title);const next=createRevision(p,'02');expect(next.title).toBe(p.title);next.process='Iný proces';expect(next.title).toBe(p.title);expect(()=>parseProject(JSON.stringify({...p,title:42}))).toThrow('názov')});
it('farba textu čísla je samostatná od farby značky a zostane v ZIP',()=>{const p=newProject();p.steps[0].photos=[{id:uid(),name:'x.png',src:'data:image/png;base64,AQIDBA==',status:'',marks:[{id:uid(),type:'number',x:10,y:10,ex:10,ey:10,color:'#ffff00',textColor:'#000000',n:1}]}];expect(importBundle(exportBundle(p))).toEqual(p)});
