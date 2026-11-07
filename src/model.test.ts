import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { newProject, newStep, moveStep, parseProject, saveProject, listProjects, removeProject, createRevision } from './model';
describe('projekty', () => {
    it('presúva kroky bez straty obsahu a rešpektuje hranice', () => { const a = newStep(), b = newStep(), c = newStep(); expect(moveStep([a, b, c], 0, 2)).toEqual([b, c, a]); expect(moveStep([a, b], 0, -1)).toEqual([a, b]); });
    it('export a import zachovajú fotografie aj anotácie', () => { const p = newProject(); p.steps[0].photos = [{ id: crypto.randomUUID(), name: 'diel.png', src: 'data:image/png;base64,AAAA', status: 'NOK', marks: [{ id: crypto.randomUUID(), type: 'arrow', x: 10, y: 20, ex: 70, ey: 80, color: '#e53935', n: 1 }] }]; expect(parseProject(JSON.stringify(p))).toEqual(p); });
    it('odmieta chybný formát aj nebezpečný zdroj obrázka', () => { expect(() => parseProject('{}')).toThrow(); const p = newProject(); p.steps[0].photos = [{ id: crypto.randomUUID(), name: 'x', src: 'javascript:alert(1)', status: '', marks: [] }]; expect(() => parseProject(JSON.stringify(p))).toThrow(); });
    it('ukladá, opätovne načíta a vymaže kompletný projekt z IndexedDB', async () => { const p = newProject(); p.steps[0].description = 'Kontrola obvodu na nedoliatky'; await saveProject(p); expect((await listProjects()).find(x => x.id === p.id)).toEqual(p); p.revision = '02'; await saveProject(p); expect((await listProjects()).find(x => x.id === p.id)?.revision).toBe('02'); await removeProject(p.id); expect((await listProjects()).find(x => x.id === p.id)).toBeUndefined(); });
});

it('nová revízia zachová originál a nezdieľa upraviteľné kroky', async () => {
 const p=newProject(); p.revision='01'; p.steps[0].description='Pôvodný postup';
 const next=createRevision(p,'02'); next.steps[0].description='Upravený postup';
 expect(p.revision).toBe('01'); expect(p.steps[0].description).toBe('Pôvodný postup');
 expect(next.id).not.toBe(p.id); expect(next.documentId).toBe(p.id); expect(next.parentRevisionId).toBe(p.id);
 await saveProject(p); await saveProject(next);
 expect((await listProjects()).filter(x=>[p.id,next.id].includes(x.id))).toHaveLength(2);
 expect(parseProject(JSON.stringify(next)).parentRevisionId).toBe(p.id);
 expect(()=>createRevision(p,'  ')).toThrow();
 await removeProject(p.id);await removeProject(next.id);
});
