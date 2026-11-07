import {it,expect} from 'vitest';
import {newProject,parseProject,createRevision} from './model';
import {exportBundle,importBundle} from './bundle';
import {newBottomBlock,blocksFor} from './bottom-blocks';
it('texty, obrázky a štýly spodných blokov zostanú v ZIP aj revízii',()=>{const p=newProject();const b=newBottomBlock('text');b.text='Vlastné pokyny\nDruhý riadok';b.background='#ffff00';b.color='#ff0000';b.bold=true;const image={...newBottomBlock('image'),src:'data:image/png;base64,AQIDBA=='};p.bottomBlocks=[[b,image],[]];expect(importBundle(exportBundle(p))).toEqual(p);expect(createRevision(p,'02').bottomBlocks).toEqual(p.bottomBlocks);expect(()=>parseProject(JSON.stringify({...p,bottomBlocks:[[{...b,width:0}],[]]}))).toThrow('spodný blok')});
it('starší pás sa dá načítať ako odstrániteľný obrázkový blok',()=>{const p=newProject();delete p.bottomBlocks;p.bottomPageOne='data:image/png;base64,AQIDBA==';expect(blocksFor(p,0)[0].src).toBe(p.bottomPageOne);expect(blocksFor(p,0)[0].type).toBe('image')});

it('riadky spodných blokov zostanú v zálohe a odmietnu neplatné čísla',()=>{const p=newProject();p.bottomRowCounts=[2,1];p.bottomBlocks![0][0].row=2;expect(importBundle(exportBundle(p))).toEqual(p);expect(createRevision(p,'02').bottomRowCounts).toEqual([2,1]);expect(()=>parseProject(JSON.stringify({...p,bottomRowCounts:[0,1]}))).toThrow();p.bottomBlocks![0][0].row=-1;expect(()=>parseProject(JSON.stringify(p))).toThrow()});
