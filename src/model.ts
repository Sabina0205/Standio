import {validateLayout,type LayoutBlock} from './layout';
import {validateCrop,type PhotoCrop} from './photo-text';
import {annotationTypes} from './annotation-tools';
import {defaultBottomBlocks,validateBottomBlocks,type BottomBlock} from './bottom-blocks';
import {additionalHeaderKeys,standardFields,defaultStandardLabel} from './header';
import { openDB } from 'idb';
export type Mark = {
    text?: string;
    fontSize?: number;
    backgroundColor?: string;
    backgroundOpacity?: number;
    showBorder?: boolean;
    textBold?: boolean;
    textAlign?: 'left'|'center'|'right';
    textColor?: string;
    rotation?: number;
    size?: number;
    strokeWidth?: number;
    id: string;
    type: string;
    x: number;
    y: number;
    ex: number;
    ey: number;
    color: string;
    n: number;
};
export type Photo = {
    crop?: PhotoCrop;
    purpose?: 'position' | 'comparison';
    id: string;
    src: string;
    name: string;
    status: string;
    marks: Mark[];
};
export type Step = {
    separatorBefore?: string;
    pointNumber?: string;
    id: string;
    title: string;
    description: string;
    time: number;
    status: string;
    photos: Photo[];
};
export type Project = {
    bottomRowCounts?:[number,number];
    paperSize?: 'A3'|'A4';
    pageBackground?:string;
    pageBorderColor?:string;
    pageBorderWidth?:number;
    layoutMode?: 'standard'|'free';
    layoutBlocks?: LayoutBlock[];
    isTemplate?: boolean;
    bottomEnabled?: [boolean,boolean];
    standardLabel?: string;
    material?: string;
    mold?: string;
    maxPages?: number;
    ct?: number;
    ctHandling?: number;
    finalCt?: number;
    title?: string;
    bottomBlocks?: [BottomBlock[],BottomBlock[]];
    bottomPageOne?: string;
    bottomPageTwo?: string;
    pointsPerPage?: number;
    companyName?: string;
    companyLogo?: string;
    drawingNumber?: string;
    productName?: string;
    productType?: string;
    model?: string;
    processNumber?: string;
    processOwner?: string;
    issueDate?: string;
    approvedBy?: string;
    documentNumber?: string;
    version: 1;
    documentId?: string;
    parentRevisionId?: string;
    locked?: boolean;
    changeNote?: string;
    id: string;
    product: string;
    process: string;
    revision: string;
    author: string;
    date: string;
    steps: Step[];
    updated: number;
};
export const uid = () => crypto.randomUUID();
export const newStep = (): Step => ({ id: uid(), title: 'Nový pracovný krok', description: '', time: 0, status: '', photos: [] });
export const newProject = (): Project => ({ version: 1, bottomBlocks:defaultBottomBlocks(), id: uid(), title:'Nová návodka', standardLabel:defaultStandardLabel, product: '', process: '', revision: '', author: '', date: new Date().toLocaleDateString('en-CA'), steps: [newStep()], updated: Date.now() });
export function moveStep(steps: Step[], from: number, to: number) { const a = [...steps]; if (to < 0 || to >= a.length)
    return a; a.splice(to, 0, a.splice(from, 1)[0]); return a; }
export function parseProject(raw: string): Project { const p = JSON.parse(raw); const str = (v: unknown) => typeof v === 'string'; const ids = new Set(); const id = (v: unknown) => { if (!str(v) || ids.has(v))
    throw Error('Neplatné identifikátory'); ids.add(v); }; if (p.version !== 1 || !['id', 'product', 'process', 'revision', 'author', 'date'].every(k => str(p[k])) || !Array.isArray(p.steps))
    throw Error('Neplatný projekt');
 if(p.pointsPerPage!==undefined&&(!Number.isInteger(p.pointsPerPage)||p.pointsPerPage<1||p.pointsPerPage>7))throw Error('Počet bodov na strane musí byť 1 až 7.');
 for(const key of ['bottomPageOne','bottomPageTwo'])if(p[key]!==undefined&&(typeof p[key]!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(p[key])))throw Error('Neplatný spodný blok strany.');
 validateLayout(p);
 if(p.maxPages!==undefined&&(!Number.isInteger(p.maxPages)||p.maxPages<1||p.maxPages>200))throw Error('Počet strán musí byť 1 až 200.');
 for(const key of ['ct','ctHandling','finalCt'])if(p[key]!==undefined&&(!Number.isFinite(p[key])||p[key]<0))throw Error('Neplatný čas dokumentu.');
 if(p.title!==undefined&&typeof p.title!=='string')throw Error('Neplatný názov návodky.');
 for(const [key] of standardFields)if(p[key]!==undefined&&typeof p[key]!=='string')throw Error('Neplatné voliteľné údaje hlavičky.');
 validateBottomBlocks(p.bottomBlocks);
 if(p.bottomRowCounts!==undefined&&(!Array.isArray(p.bottomRowCounts)||p.bottomRowCounts.length!==2||p.bottomRowCounts.some((n:unknown)=>!Number.isInteger(n)||Number(n)<1||Number(n)>20)))throw Error('Neplatný počet spodných riadkov.');
 for (const key of additionalHeaderKeys) if (p[key] !== undefined && !str(p[key])) throw Error('Neplatná hlavička dokumentu.');
 if (p.companyLogo !== undefined && (typeof p.companyLogo !== 'string' || (p.companyLogo !== '' && !/^data:image\/(png|jpeg|webp);base64,/.test(p.companyLogo)))) throw Error('Neplatné logo spoločnosti.');
 if ((p.documentId !== undefined && !str(p.documentId)) || (p.parentRevisionId !== undefined && !str(p.parentRevisionId))) throw Error('Neplatná história revízií'); id(p.id); for (const s of p.steps) {
    id(s.id);
    if (s.pointNumber !== undefined && typeof s.pointNumber !== 'string') throw Error('Neplatné číslo kontrolného bodu.');
    if(s.separatorBefore!==undefined&&(!str(s.separatorBefore)||s.separatorBefore.length>2000))throw Error('Neplatný deliaci riadok.');
    if (!str(s.title) || !str(s.description) || !Number.isFinite(s.time) || s.time < 0 || !['', 'OK', 'NOK'].includes(s.status) || !Array.isArray(s.photos))
        throw Error('Neplatný krok');
    for (const f of s.photos) {
        id(f.id);
        validateCrop(f.crop);
        if (f.purpose !== undefined && !['position','comparison'].includes(f.purpose)) throw Error('Neplatné zaradenie fotografie.');
        if (f.purpose === 'comparison' && !['OK','NOK'].includes(f.status)) throw Error('Fotografia porovnania musí mať označenie OK alebo NOK.');
        if (f.purpose === 'position' && f.status !== '') throw Error('Fotografia polohy nemá výsledok OK/NOK.');
        if (!str(f.name) || !/^data:image\/(png|jpeg|webp);base64,/.test(f.src) || !['', 'OK', 'NOK'].includes(f.status) || !Array.isArray(f.marks))
            throw Error('Neplatná fotografia');
        for (const m of f.marks) {
            id(m.id);
            if((m.type==='text'&&typeof m.text!=='string')||(m.text!==undefined&&(typeof m.text!=='string'||m.text.length>10000))||(m.fontSize!==undefined&&(!Number.isFinite(m.fontSize)||m.fontSize<1||m.fontSize>10))||(m.backgroundColor!==undefined&&!/^#[0-9a-f]{6}$/i.test(m.backgroundColor))||(m.backgroundOpacity!==undefined&&(!Number.isFinite(m.backgroundOpacity)||m.backgroundOpacity<0||m.backgroundOpacity>1))||(m.showBorder!==undefined&&typeof m.showBorder!=='boolean')||(m.textBold!==undefined&&typeof m.textBold!=='boolean')||(m.textAlign!==undefined&&!['left','center','right'].includes(m.textAlign)))throw Error('Neplatné textové pole.');
            if(m.textColor!==undefined&&!/^#[0-9a-f]{6}$/i.test(m.textColor))throw Error('Neplatná farba textu značky.');
            if ((m.rotation!==undefined&&(!Number.isFinite(m.rotation)||m.rotation < -180||m.rotation>180))||(m.size!==undefined&&(!Number.isFinite(m.size)||m.size<2||m.size>30))||(m.strokeWidth!==undefined&&(!Number.isFinite(m.strokeWidth)||m.strokeWidth<.2||m.strokeWidth>3)))throw Error('Neplatná veľkosť alebo otočenie značky.');
            if (!annotationTypes.includes(m.type) || !/^#[0-9a-f]{6}$/i.test(m.color) || !['x', 'y', 'ex', 'ey'].every(k => Number.isFinite(m[k]) && m[k] >= 0 && m[k] <= 100) || !Number.isInteger(m.n) || m.n < 1)
                throw Error('Neplatná anotácia');
        }
    }
} return p; }
const db = () => openDB('navodky-studio', 1, { upgrade(db) { db.createObjectStore('projects', { keyPath: 'id' }); } });
export const saveProject = async (p: Project) => { const d = await db(); const tx = d.transaction('projects', 'readwrite'); const old = await tx.store.get(p.id); if (old?.locked && JSON.stringify(old) !== JSON.stringify(p)) { await tx.done; throw Error('Uzamknutú revíziu nemožno meniť. Vytvorte novú revíziu.'); } if(p.revision.trim()&&old?.revision!==p.revision){const family=p.documentId||p.id;const all:Project[]=await tx.store.getAll();if(all.some(x=>x.id!==p.id&&(x.documentId||x.id)===family&&x.revision.trim().toLowerCase()===p.revision.trim().toLowerCase())){await tx.done;throw Error('Táto revízia už existuje. Zvoľte iné označenie.');}} await tx.store.put(p); await tx.done; };
export const listProjects = async (): Promise<Project[]> => (await (await db()).getAll('projects')).sort((a, b) => b.updated - a.updated);
export const removeProject = async (id: string) => { const d = await db(); const tx = d.transaction('projects', 'readwrite'); const old = await tx.store.get(id); if (old?.locked) { await tx.done; throw Error('Uzamknutú revíziu nemožno vymazať.'); } await tx.store.delete(id); await tx.done; };

export async function commitRevision(source: Project, revision: string, changeNote: string) {
 const d = await db(); const tx = d.transaction('projects', 'readwrite');
 const all: Project[] = await tx.store.getAll();
 const family = source.documentId || source.id;
 if (all.some(p => (p.documentId || p.id) === family && p.revision.toLowerCase() === revision.trim().toLowerCase())) { await tx.done; throw Error('Táto revízia už existuje. Zvoľte iné označenie.'); }
 const stored = await tx.store.get(source.id);
 if (stored?.locked && JSON.stringify(stored) !== JSON.stringify(source)) { await tx.done; throw Error('Revízia bola medzičasom uzamknutá. Obnovte stránku.'); }
 const next = {...createRevision(source, revision), locked: false, changeNote};
 await tx.store.put({...source, locked: true}); await tx.store.put(next); await tx.done; return next;
}

export async function restoreLibrary(raw: string) {
 const data = JSON.parse(raw); if (data.format !== 'navodky-backup-1' || !Array.isArray(data.projects)) throw Error('Neplatná záloha knižnice.');
 const items: Project[] = data.projects.map((p: unknown) => parseProject(JSON.stringify(p)));
 const ids = new Set(items.map(p => p.id)); if (ids.size !== items.length) throw Error('Duplicitné ID v zálohe.');
 const mapping = new Map(items.map(p => [p.id, uid()]));
 const d = await db(); const tx = d.transaction('projects','readwrite');
 for (const p of items) await tx.store.put({...p,id:mapping.get(p.id)!,documentId:mapping.get(p.documentId || p.id) || mapping.get(p.id),parentRevisionId:p.parentRevisionId ? mapping.get(p.parentRevisionId) : undefined});
 await tx.done;
}

export function createRevision(source: Project, revision: string): Project {
    if (!revision.trim()) throw Error('Vyplňte označenie novej revízie.');
    const copy = structuredClone(source);
    return { ...copy, id: uid(), documentId: source.documentId || source.id, parentRevisionId: source.id,
        locked: false, revision: revision.trim(), date: new Date().toLocaleDateString('en-CA'), updated: Date.now() };
}

export function photoGroup(photo:Photo):'position'|'OK'|'NOK' { return photo.purpose==='position'?'position':photo.status==='NOK'?'NOK':photo.status==='OK'?'OK':'position'; }

export function duplicateStep(step:Step):Step{const copy=structuredClone(step);copy.id=uid();delete copy.pointNumber;copy.photos=copy.photos.map(photo=>({...photo,id:uid(),marks:photo.marks.map(mark=>({...mark,id:uid()}))}));return copy}
