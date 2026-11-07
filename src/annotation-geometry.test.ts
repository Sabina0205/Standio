import {it,expect} from 'vitest';
import {moveMark,scaleMark,rotated} from './annotation-geometry';
import {newProject,uid,parseProject,createRevision,type Mark} from './model';
import {exportBundle,importBundle} from './bundle';
const rect=():Mark=>({id:uid(),type:'rect',x:20,y:30,ex:60,ey:70,color:'#ff0000',n:1});
it('posun zachová veľkosť a nevyjde z fotografie',()=>{const m=rect();expect(moveMark(m,10,-10)).toMatchObject({x:30,y:20,ex:70,ey:60});expect(moveMark(m,100,100)).toMatchObject({x:60,y:60,ex:100,ey:100})});
it('zmenšenie zachová stred, číslo sa zväčšuje samostatne',()=>{const m=rect();expect(scaleMark(m,.5)).toMatchObject({x:30,y:40,ex:50,ey:60});expect(scaleMark({...m,type:'number',size:10},2).size).toBe(20);expect(scaleMark({...m,type:'number',size:10},100).size).toBe(30)});
it('otáča v obrazových súradniciach',()=>{const p=rotated(20,10,10,10,90);expect(p.x).toBeCloseTo(10);expect(p.y).toBeCloseTo(20)});
it('farba, hrúbka, otočenie a veľkosť zostanú v ZIP aj novej revízii',()=>{const p=newProject();p.steps[0].photos=[{id:uid(),name:'test.png',src:'data:image/png;base64,AQIDBA==',status:'',purpose:'position',marks:[{...rect(),rotation:45,strokeWidth:1.6},{...rect(),id:uid(),type:'number',size:12,n:7}]}];const copy=importBundle(exportBundle(p));expect(copy).toEqual(p);expect(createRevision(copy,'02').steps[0].photos).toEqual(p.steps[0].photos);expect(()=>parseProject(JSON.stringify({...p,steps:[{...p.steps[0],photos:[{...p.steps[0].photos[0],marks:[{...rect(),rotation:NaN}]}]}]}))).toThrow()});
