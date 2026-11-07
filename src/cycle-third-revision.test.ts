import {it,expect} from 'vitest';
import {fitPageEnds,fitTwoPages} from './pagination';
import {newProject,createRevision,parseProject,saveProject,listProjects,uid} from './model';
import {exportBundle,importBundle,projectCsv,importCsv} from './bundle';
import 'fake-indexeddb/auto';
it('tretia strana rozdelí obsah až pri povolenej tretej kapacite',()=>{expect(fitTwoPages([60,60,60],100,100)).toBeNull();expect(fitPageEnds([60,60,60],[100,100,100])).toEqual([1,2,3])});
it('CT údaje a potvrdená tretia strana zostanú v ZIP, CSV a revízii',()=>{const p=newProject();p.revision='19B';p.ct=12.5;p.ctHandling=3;p.finalCt=15.5;p.maxPages=3;expect(importBundle(exportBundle(p))).toEqual(p);const csv=importCsv(projectCsv(p));expect([csv.ct,csv.ctHandling,csv.finalCt,csv.revision]).toEqual([12.5,3,15.5,'19B']);expect(createRevision(p,'20').maxPages).toBe(3);expect(()=>parseProject(JSON.stringify({...p,maxPages:201}))).toThrow();expect(()=>parseProject(JSON.stringify({...p,ct:-1}))).toThrow()});
it('nová návodka nemá automaticky určenú revíziu a ručne zadaná sa uloží',async()=>{const p=newProject();expect(p.revision).toBe('');p.revision='R07';await saveProject(p);expect((await listProjects()).find(x=>x.id===p.id)?.revision).toBe('R07');const next={...createRevision(p,'R08'),id:uid()};await saveProject(next);await expect(saveProject({...next,revision:'R07'})).rejects.toThrow('už existuje')});
