import {describe,it,expect} from 'vitest';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
import {newProject,uid} from './model';
import {projectCsv,readCsv,applyCsv,exportBundle,importBundle} from './bundle';
const sample=()=>{const p=newProject();p.product='Diel; "A"';p.steps[0].description='Prvý riadok\nDruhý; "kontrola"';p.steps[0].title='=NEBEZPECNY_VZOREC()';p.steps[0].photos=[{id:uid(),name:'diel.png',src:'data:image/png;base64,AQIDBA==',status:'OK',marks:[{id:uid(),type:'circle',x:1,y:2,ex:50,ey:60,color:'#00ff00',n:1}]}];return p};
describe('ZIP s CSV a fotografiami',()=>{
 it('celý balík zachová fotografie aj anotácie',()=>{const p=sample();const zip=exportBundle(p);expect(importBundle(zip)).toEqual(p);const files=unzipSync(zip);expect(Object.keys(files).some(s=>s.startsWith('fotografie/'))).toBe(true);expect(strFromU8(files['navodka.csv'])).toContain('Fotografie')});
 it('CSV zachová bodkočiarky, úvodzovky, nové riadky aj text podobný vzorcu',()=>{const p=sample();expect(applyCsv(p,projectCsv(p))).toEqual(p);expect(projectCsv(p)).toContain("'=NEBEZPECNY");expect(readCsv(projectCsv(p))[1][7]).toBe(p.steps[0].description)});
 it('úprava CSV zmení popis a čas pri zachovaní fotiek',()=>{const p=sample();const files=unzipSync(exportBundle(p));files['navodka.csv']=strToU8(strFromU8(files['navodka.csv']).replace('Prvý riadok','Upravený riadok').replace('"0";','"45";'));const next=importBundle(zipSync(files));expect(next.steps[0].description).toContain('Upravený');expect(next.steps[0].time).toBe(45);expect(next.steps[0].photos).toEqual(p.steps[0].photos)});
 it('odmieta chýbajúcu fotku, chybný čas a neuzavreté CSV',()=>{const p=sample();const files=unzipSync(exportBundle(p));delete files[Object.keys(files).find(s=>s.startsWith('fotografie/'))!];expect(()=>importBundle(zipSync(files))).toThrow('chýba fotografia');expect(()=>applyCsv(p,projectCsv(p).replace('"0";','"-1";'))).toThrow('čas');expect(()=>readCsv('"neuzavreté')).toThrow()});
});
