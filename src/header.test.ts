import {describe,it,expect} from 'vitest';
import {newProject,createRevision,parseProject} from './model';
import {additionalHeaderKeys} from './header';
import {projectCsv,importCsv,readCsv,applyCsv,exportBundle,importBundle} from './bundle';
describe('firemná hlavička',()=>{
 it('uloží všetky doplnené údaje a logo v ZIP aj JSON a texty v CSV',()=>{
  const p=newProject();additionalHeaderKeys.forEach((k,i)=>p[k]='Údaj '+i);p.companyLogo='data:image/png;base64,AQIDBA==';
  expect(importBundle(exportBundle(p))).toEqual(p);expect(parseProject(JSON.stringify(p))).toEqual(p);
  const csv=importCsv(projectCsv(p));additionalHeaderKeys.forEach(k=>expect(csv[k]).toBe(p[k]));expect(csv.companyLogo).toBeUndefined();
  const next=createRevision(p,'02');expect(next.companyLogo).toBe(p.companyLogo);expect(next.issueDate).toBe(p.issueDate);expect(next.documentNumber).toBe(p.documentNumber);
 });
 it('stále načíta pôvodný 11-stĺpcový CSV projekt',()=>{const p=newProject();p.product='LEGACY';const legacy=readCsv(projectCsv(p)).map(row=>row.slice(0,11).map(v=>'"'+v.replaceAll('"','""')+'"').join(';')).join('\r\n');expect(applyCsv(p,legacy)).toEqual(p);expect(importCsv(legacy).product).toBe('LEGACY')});
 it('odmietne nevhodný zdroj loga aj neplatný nový údaj',()=>{const p=newProject();expect(()=>parseProject(JSON.stringify({...p,companyLogo:'https://example.com/logo.svg'}))).toThrow('logo');expect(()=>parseProject(JSON.stringify({...p,documentNumber:{text:'x'}}))).toThrow('hlavička')});
});
