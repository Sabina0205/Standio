import {paperArea} from './layout';
import {FreePage} from './LegacyPage';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {createPortal} from 'react-dom';
import {fitPageEnds} from './pagination';
import { type Project, type Step, type Photo, type Mark, uid, duplicateStep, newProject, newStep, moveStep, parseProject, saveProject, listProjects, removeProject, commitRevision, restoreLibrary, photoGroup } from './model';
import './style.css';
import {headerFields,cycleFields,defaultStandardLabel} from './header';
import {BottomContent,BottomEditor} from './BottomEditor';
import {Picture} from './Picture';
import {ComparisonGallery} from './ComparisonGallery';
import {annotationTools} from './annotation-tools';

import {exportBundle,importBundle,projectCsv,importCsv} from './bundle';
type LayoutReport=(source:Project,ready:boolean,fits:boolean)=>void;
function Document({p,onLayout,onAddPage}:{p:Project;onLayout?:LayoutReport;onAddPage?:()=>void}){const count=Math.max(p.maxPages||2,...(p.layoutBlocks||[]).filter(b=>!b.repeat).map(b=>b.page));useEffect(()=>{if(p.layoutMode==='free')onLayout?.(p,true,true)},[p,count]);if(p.layoutMode!=='free')return <TableDocument p={p} onLayout={onLayout} onAddPage={onAddPage}/>;return <div className="document-pages" data-ready="true" data-fits="true"><style>{'@page{size:'+(p.paperSize||'A3')+' portrait;margin:10mm 10mm 18mm;@bottom-left{content:none}@bottom-right{content:none}}'}</style>{Array.from({length:count},(_,i)=><article className={'paper free-paper paper-'+(p.paperSize||'A3').toLowerCase()} key={i}><FreePage p={p} page={i+1}/></article>)}</div>}
function TableDocument({p,onLayout}:{p:Project;onLayout?:LayoutReport;onAddPage?:()=>void}) {
 const pageCount=p.maxPages||2;
 const [layout,setLayout]=useState<{source:Project;ends:number[];density:number;fits:boolean}|null>(null);
 const probe=useRef<HTMLDivElement>(null);const report=useRef(onLayout);report.current=onLayout;
 const ready=layout?.source===p;
 useEffect(()=>{
  let cancelled=false;report.current?.(p,false,false);
  const measure=async()=>{
   const root=probe.current;if(!root)return;
   await Promise.all(Array.from(root.querySelectorAll('img')).map(img=>img.decode().catch(()=>{})));
   await document.fonts.ready;await new Promise<void>(r=>requestAnimationFrame(()=>r()));
   if(cancelled)return;
   const papers=Array.from(root.querySelectorAll<HTMLElement>('.paper'));
   let result:{ends:number[];density:number;fits:boolean}={ends:Array.from({length:pageCount},(_,i)=>Math.ceil(p.steps.length*(i+1)/pageCount)),density:3,fits:false};
   for(let density=0;density<4;density++){
    root.dataset.density=String(density);
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));if(cancelled)return;
    const measuredRows=Array.from(papers[0].querySelectorAll<HTMLElement>('.instruction-table > tbody > tr'));
    const heights=p.steps.map(step=>measuredRows.filter(row=>row.dataset.stepId===step.id).reduce((sum,row)=>sum+row.getBoundingClientRect().height,0));
    const capacity=papers.map(paper=>paper.clientHeight-paper.querySelector('.instruction-table > thead')!.getBoundingClientRect().height-paper.querySelector('.page-supplement')!.getBoundingClientRect().height-10);
    const capacities=Array.from({length:pageCount},(_,i)=>capacity[Math.min(i,1)]);let ends=fitPageEnds(heights,capacities);while(!ends&&capacities.length<200&&heights.every(h=>h<=Math.max(...capacity))){capacities.push(capacity[1]);ends=fitPageEnds(heights,capacities)}
    if(ends!==null){result={ends,density,fits:true};break}
   }
   if(!cancelled){setLayout({source:p,...result});report.current?.(p,true,result.fits)}
  };
  measure().catch(()=>{if(!cancelled){setLayout({source:p,ends:Array.from({length:pageCount},(_,i)=>Math.ceil(p.steps.length*(i+1)/pageCount)),density:3,fits:false});report.current?.(p,true,false)}});
  return()=>{cancelled=true};
 },[p]);
 const ends=ready?layout.ends:Array.from({length:pageCount},(_,i)=>Math.ceil(p.steps.length*(i+1)/pageCount));
 return <><div className="document-pages automatic-pages" data-ready={String(ready)} data-fits={String(ready&&layout.fits)} data-density={ready?layout.density:0}>
 {!ready&&<p className="pagination-message" role="status">Počítam rozloženie dokumentu {p.paperSize||'A3'}…</p>}
 {ready&&!layout.fits&&<div className="pagination-message overflow-warning" role="alert">Jeden bod alebo spodný blok je väčší než tlačiteľná plocha, alebo dokument presahuje 200 strán. Skráťte obsah tohto bodu. Tlač je zatiaľ zablokovaná.</div>}
 {ready&&ends.length>pageCount&&<p className="pagination-message">Podľa obsahu sa automaticky pridali strany. Celkom: {ends.length} × {p.paperSize||'A3'}.</p>}
 {ends.map((end,page)=><DocumentPage key={page} p={p} steps={p.steps.slice(page===0?0:ends[page-1],end)} page={page} startIndex={page===0?0:ends[page-1]}/>)}

 </div>{!ready&&createPortal(<div className={'pagination-probe format-'+(p.paperSize||'A3').toLowerCase()} ref={probe} data-density="0" aria-hidden="true">{Array.from({length:Math.max(2,pageCount)},(_,page)=><DocumentPage key={page} p={p} steps={page===0?p.steps:[]} page={page} startIndex={0} measure/>)}</div>,document.body)}</>;
}
function DocumentPage({p,steps,page,startIndex,measure=false}:{p:Project;steps:Step[];page:number;startIndex:number;measure?:boolean}) {
 const footerText=JSON.stringify('DOKUMENT no. '+(p.documentNumber||'—').replace(/[\r\n\f]/g,' '));
 const printFooter='@media print{.standard-footer{display:none!important}} @page { size:'+(p.paperSize||'A3')+' portrait; margin:10mm 10mm 18mm; @bottom-left {content:'+footerText+';font:9pt Arial;color:#243d2d;} @bottom-right {content:"SMK7";font:bold 9pt Arial;color:#243d2d;} }';
 const optionalCount=Number(!!p.material?.trim())+Number(!!p.mold?.trim());
 const cell=(key:keyof Project,sk:string,en:string,span:number)=> <th colSpan={span} className="standard-cell"><span>{sk}<br/>{en}</span><strong>{String(p[key]||'—')}</strong></th>;
 return <article className={'paper compact-paper paper-'+(p.paperSize||'A3').toLowerCase()} data-page={page+1}><style>{printFooter}</style><table className="instruction-table"><colgroup><col style={{width:'8%'}}/><col style={{width:'29%'}}/><col style={{width:'42%'}}/><col style={{width:'21%'}}/></colgroup><thead>
 <tr><th colSpan={4} className="standard-header-wrap"><table className="standard-header"><colgroup>{Array.from({length:12+optionalCount},(_,i)=><col key={i} style={{width:(100/(12+optionalCount))+'%'}}/>)}</colgroup><tbody>
 <tr><th rowSpan={2} className="company-cell">{p.companyLogo&&<img src={p.companyLogo} alt="Logo spoločnosti"/>}<strong>{p.companyName||'Názov firmy'}</strong><div className="header-cycle-times">{cycleFields.map(([key,label])=><div key={key}><span>{label}:</span> <b>{p[key]===undefined?'—':p[key]+' s'}</b></div>)}</div></th><th colSpan={2} className="part-standard">{p.standardLabel??defaultStandardLabel}</th>
 {cell('product','Číslo produktu','Product number',3)}{cell('drawingNumber','Číslo výkresu','Drawing number',2)}{p.material?.trim()&&cell('material','Materiál','Material',1)}{p.mold?.trim()&&cell('mold','Forma','Mold',1)}{cell('date','Dátum revízie','Revision date',2)}{cell('revision','Revízia','Revision',1)}{cell('author','Vypracoval','Prepared by',1)}</tr>
 <tr>{cell('productName','Meno produktu','Product name',2)}{cell('productType','Typ','Type',1)}{cell('model','Model','Model',2+optionalCount)}{cell('process','Proces','Process',2)}{cell('processNumber','Číslo procesu','Process number',1)}{cell('processOwner','Vlastníci procesu','Process owner',1)}{cell('issueDate','Dátum vydania','Date of issue',1)}{cell('approvedBy','Schválil','Approved by',1)}</tr>
 </tbody></table></th></tr>
 {(steps.length>0||measure)&&<tr className="column-head"><th>KONTROLNÝ BOD<br/>CT (s)</th><th>POLOHA KUSU</th><th>OK / NOK — VIZUÁLNE PRÍKLADY</th><th>POPIS</th></tr>}</thead>
 <tbody>{steps.map((s,i)=><React.Fragment key={s.id}>{s.separatorBefore?.trim()&&<tr className="step-separator" data-step-id={s.id}><td colSpan={4}>{s.separatorBefore}</td></tr>}<tr data-step-id={s.id}><td className="doc-step"><strong>{s.pointNumber||startIndex+i+1}</strong><small>CT<br/>{s.time} s</small></td>
 <td className="position-cell"><div className="position-photos">{s.photos.filter(f=>photoGroup(f)==='position').map(f=><Picture key={f.id} photo={f}/>)}</div>{!s.photos.some(f=>photoGroup(f)==='position')&&<p className="muted">Poloha kusu nie je vložená</p>}</td>
 <td className="comparison-cell"><ComparisonGallery photos={s.photos.filter(f=>photoGroup(f)!=='position')}/></td>
 <td className="doc-description"><strong className="doc-point-title">{s.title}</strong><div className="doc-point-body"><p>{s.description}</p>{s.status&&<span className={'status '+s.status}>{s.status}</span>}</div></td></tr></React.Fragment>)}</tbody></table>
 <div className="page-supplement"><BottomContent project={p} page={page===0?0:1}/></div>
 <footer className="standard-footer"><span>DOKUMENT no. <strong>{p.documentNumber||'—'}</strong></span><strong>SMK7</strong></footer></article>;
}
function App() {
 const [printRequested,requestPrint]=useState(false);
 const [editorSection,SECTION]=useState<'header'|'footer'|'bottom'|'step'>('header');
 const [newPaper,NP]=useState<'A3'|'A4'>('A3'),[newPages,NPG]=useState(2);
 const [printLayout,reportLayout]=useState<{source:Project;ready:boolean;fits:boolean}|null>(null);
    const [project, P] = useState<Project | null>(null), [projects, L] = useState<Project[]>([]), [active, A] = useState(''), [preview, V] = useState(false), [saved, S] = useState(''), [error, E] = useState(''), [tool, T] = useState('circle'), [color, C] = useState('#e53935');
    useEffect(()=>{if(printRequested&&preview&&printLayout?.source===project&&printLayout.ready){requestPrint(false);if(printLayout.fits){requestAnimationFrame(()=>requestAnimationFrame(()=>window.print()))}else E('Obsah sa nezmestí do povoleného počtu A3 strán. Upravte ho podľa upozornenia v náhľade.')}},[printRequested,preview,printLayout,project]);
    useEffect(()=>{document.title=project?.title?project.title+' — rev. '+project.revision:'Standio'},[project?.title,project?.revision]);
    const input = useRef<HTMLInputElement>(null), writes = useRef(Promise.resolve()), generation = useRef(0);
    const refresh = () => listProjects().then(L).catch(() => E('Úložisko nie je dostupné. Použite export projektu.'));
    useEffect(() => { refresh(); }, []);
    useEffect(() => { if (!project || project.locked)
        return; S('Ukladám…'); const g = ++generation.current; const t = setTimeout(() => { writes.current = writes.current.catch(() => { }).then(() => saveProject(project)).then(() => { if (g === generation.current)
        S('Uložené v tomto prehliadači'); }).catch(() => { S('Neuložené'); E('Uloženie zlyhalo. Exportujte projekt ako zálohu.'); }); }, 300); return () => clearTimeout(t); }, [project]);
    const edit = (patch: Partial<Project>) => project && !project.locked && P({ ...project, ...patch, updated: Date.now() });
    const step = project?.steps.find(s => s.id === active);
    const es = (patch: Partial<Step>) => project && step && edit({ steps: project.steps.map(s => s.id === active ? { ...s, ...patch } : s) });
    const open = (p: Project) => { SECTION('header');P(p); A(p.steps[0]?.id || ''); V(false); E(''); };
    const createDocument=()=>{const next=newProject();next.paperSize=newPaper;next.maxPages=newPages;open(next)};
    const changePaper=(paperSize:'A3'|'A4')=>{if(!project)return;const before=paperArea(project),after=paperArea({paperSize});edit({paperSize,layoutBlocks:project.layoutBlocks?.map(b=>({...b,x:b.x*after.width/before.width,y:b.y*after.height/before.height,width:b.width*after.width/before.width,height:b.height*after.height/before.height,fontSize:Math.max(6,b.fontSize*Math.min(after.width/before.width,after.height/before.height))}))})};
    const flush = async () => { if (project && !project.locked) {
        await writes.current.catch(() => { });
        await saveProject(project);
    } };
    const back = async () => { try {
        await flush();
        P(null);
        refresh();
    }
    catch {
        E('Uloženie zlyhalo. Najprv exportujte projekt.');
    } };
    const revise = async () => {
        if (!project) return;
        try {
            await flush();
            const all = await listProjects();
            const family = all.filter(p => (p.documentId || p.id) === (project.documentId || project.id));
            
            const suggestion = '';
            const label = prompt('Nová revízia: zadajte označenie. Pôvodná návodka zostane zachovaná; upravovať budete novú kópiu.', suggestion);
            if (label === null) return;
            if (family.some(p => p.revision.trim().toLowerCase() === label.trim().toLowerCase())) throw Error('Táto revízia už existuje. Zvoľte iné označenie.');
            const next = await commitRevision(project, label, 'Nová revízia');
            await refresh();
            open(next);
        } catch (e) { E(e instanceof Error ? e.message : 'Vytvorenie revízie zlyhalo.'); }
    };
    const download = (body: string, name: string, type: string) => { const url=URL.createObjectURL(new Blob([body],{type})); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); };
    const backup = async () => { try { await flush(); download(JSON.stringify({format:'navodky-backup-1',created:new Date().toISOString(),projects:await listProjects()},null,2),'navodky-zaloha.json','application/json'); } catch { E('Záloha zlyhala.'); } };
    const exportZip = () => { if (!project) return; try {
        const bytes = exportBundle(project);
        const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], {type:'application/zip'}));
        const a = document.createElement('a'); a.href=url; a.download=(project.title||project.product||'navodka').replace(/[^a-zA-Z0-9_áäčďéíľĺňóôŕšťúýž-]/gi,'_')+'-rev-'+project.revision.replace(/[^a-zA-Z0-9_-]/g,'_')+'.zip'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    } catch(e) { E(e instanceof Error?e.message:'Export balíka zlyhal.'); } };
    const exportFile = () => { if (!project)
        return; const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = (project.title||'navodka').replace(/[^a-zA-Z0-9_áäčďéíľĺňóôŕšťúýž-]/gi,'_')+'-rev-'+project.revision.replace(/[^a-zA-Z0-9_-]/g,'_')+'.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    const importFile = async (f?: File) => { if (!f)
        return; try {
        if (f.name.toLowerCase().endsWith('.pdf')) throw Error('PDF slúži na tlač. Na úpravy a novú revíziu nahrajte ZIP alebo JSON projekt.');
        if (f.size > 150 * 1024 * 1024)
            throw Error('Maximálna veľkosť projektu je 150 MB.');
        if (f.name.endsWith('.json')) { const raw=await f.text(); if (JSON.parse(raw).format==='navodky-backup-1') { await flush(); await restoreLibrary(raw); P(null); await refresh(); return; } }
        const p = f.name.toLowerCase().endsWith('.csv') ? importCsv(await f.text()) : f.name.toLowerCase().endsWith('.zip') ? importBundle(new Uint8Array(await f.arrayBuffer())) : parseProject(await f.text());
        await flush();
        const copy = { ...p, id: uid(), documentId: undefined, parentRevisionId: undefined, locked: false, changeNote: 'Importovaná pracovná kópia', updated: Date.now() };
        await saveProject(copy);
        open(copy);
        if (f.name.toLowerCase().endsWith('.csv')) E('Načítané CSV obsahuje iba texty. Na obnovenie fotografií a značiek použite celú návodku vo formáte ZIP.');
    }
    catch (e) {
        E(e instanceof Error ? e.message : 'Import zlyhal');
    } };
    const addPhotos = async (files: FileList | null, group:'position'|'OK'|'NOK') => { if (!step || !files)
        return; try {
        const photos: Photo[] = [];
        for (const f of Array.from(files)) {
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type) || f.size > 20 * 1024 * 1024)
                throw Error('Vyberte JPG, PNG alebo WebP do 20 MB.');
            const src = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(f); });
            await new Promise<void>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(); i.onerror = () => reject(Error('Poškodená fotografia')); i.src = src; });
            photos.push({ id: uid(), name: f.name, src, purpose:group==='position'?'position':'comparison', status:group==='position'?'':group, marks: [] });
        }
        P(prev=>prev&&prev.id===project?.id&&!prev.locked?{...prev,updated:Date.now(),steps:prev.steps.map(s=>s.id===step.id?{...s,photos:[...s.photos,...photos]}:s)}:prev);
    }
    catch (e) {
        E(e instanceof Error ? e.message : 'Pridanie fotografií zlyhalo');
    } };
    const addLogo = async (f?:File) => {
        if (!f || !project || project.locked) return;
        try {
            if (!['image/png','image/jpeg','image/webp'].includes(f.type) || f.size>2*1024*1024) throw Error('Logo: vyberte PNG, JPG alebo WebP do 2 MB.');
            const src=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result as string);r.onerror=reject;r.readAsDataURL(f)});
            await new Promise<void>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve();i.onerror=()=>reject(Error('Logo sa nepodarilo načítať.'));i.src=src});
            edit({companyLogo:src});
        } catch(e) { E(e instanceof Error?e.message:'Logo sa nepodarilo pridať.'); }
    };
    const addStep=()=>{if(!project||project.locked)return;const s=newStep();edit({steps:[...project.steps,s]});A(s.id);SECTION('step');requestAnimationFrame(()=>document.querySelector('.step-editor-panel')?.scrollIntoView({block:'start'}))};
    const photoChange = (p: Photo) => es({ photos: step!.photos.map(f => f.id === p.id ? p : f) });
    const groups=[{key:'position',title:'2. Poloha kusu',help:'Jedna alebo viac fotografií správneho natočenia a uchopenia kusu.'},{key:'OK',title:'3. OK kusy',help:'Správne vyhotovenie — zelený rám.'},{key:'NOK',title:'3. NOK kusy',help:'Nesprávne vyhotovenie — červený rám.'}] as const;
    const uploader=(group:'position'|'OK'|'NOK')=><label className="button">＋ Pridať fotografie {group==='position'?'polohy':group}<input aria-label={'Pridať fotografie '+(group==='position'?'polohy':group)} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e=>{addPhotos(e.target.files,group);e.target.value=''}}/></label>;
    const photoCard=(p:Photo)=><article className="photo-card" key={p.id}><Picture photo={p} tool={project?.locked?undefined:tool} color={color} onChange={photoChange} onSelect={()=>T('select')}/><div className="photo-caption"><span title={p.name}>{p.name}</span><select aria-label={'Zaradenie '+p.name} value={photoGroup(p)} onChange={e=>photoChange({...p,purpose:e.target.value==='position'?'position':'comparison',status:e.target.value==='position'?'':e.target.value})}><option value="position">Poloha</option><option>OK</option><option>NOK</option></select><button aria-label="Odobrať poslednú značku" disabled={!p.marks.length} onClick={()=>photoChange({...p,marks:p.marks.slice(0,-1)})}>↶</button><button aria-label={'Vymazať fotografiu '+p.name} onClick={()=>{if(confirm('Vymazať fotografiu aj s označeniami?'))es({photos:step!.photos.filter(f=>f.id!==p.id)})}}>×</button></div></article>;
    return <><input ref={input} hidden type="file" accept=".json,.zip,.csv,application/json,application/zip,text/csv" onChange={e => { importFile(e.target.files?.[0]); e.target.value = ''; }}/><header className="app-header"><div className="brand"><b>▤</b> Standio</div></header>{error && <div role="alert" className="error">{error}<button onClick={() => E('')}>Zavrieť</button></div>}{!project ? <main className="library"><div className="creation-options"><label>Formát novej návodky<select aria-label="Formát novej návodky" value={newPaper} onChange={e=>NP(e.target.value as 'A3'|'A4')}><option>A3</option><option>A4</option></select></label><label>Počiatočný počet strán<input aria-label="Počiatočný počet strán" type="number" min="1" max="200" value={newPages} onChange={e=>NPG(Math.max(1,Math.min(200,Number(e.target.value)||1)))}/></label><small>Ďalšie strany sa pridajú automaticky podľa obsahu.</small></div><div className="eyebrow">PRACOVNÉ ŠTANDARDY</div><div className="library-top"><div><h1>Vaše návodky</h1><p>Od prvého kroku po jasný pracovný postup.</p></div><div className="actions"><button onClick={backup}>↓ Záloha celej knižnice</button><button onClick={() => input.current?.click()}>↑ Nahrať návodku / zálohu</button><button className="primary" onClick={() => createDocument()}>＋ Nová návodka</button></div></div><div className="file-workflow"><strong>Vaša návodka zostáva vo vašich súboroch.</strong><p>Uložte celú návodku do ZIP aj s fotografiami a značkami. Neskôr ju nahrajte späť a zvoľte Nová revízia. PDF je určené na tlač; samostatné CSV obsahuje iba texty.</p></div><div className="project-grid">{projects.map(p => <article className="project-card" key={p.id}><div className="card-symbol">▤</div><span className="tag">REV. {p.revision}{p.locked ? " · UZAMKNUTÁ" : " · ROZPRACOVANÁ"}</span><h2>{p.title||'Návodka bez názvu'}</h2><p>{p.product || 'Produkt nie je vyplnený'}</p><div className="card-bottom"><small>{p.steps.length} krokov · {p.date}</small><button onClick={() => open(p)}>Otvoriť →</button><button disabled={p.locked} aria-label={`Vymazať ${p.title||'návodku'}`} onClick={async () => { if (confirm('Natrvalo vymazať návodku?'))
        try {
            await removeProject(p.id);
            refresh();
        }
        catch {
            E('Vymazanie zlyhalo');
        } }}>×</button></div></article>)}</div>{!projects.length && <div className="empty-library"><div className="card-symbol">▤</div><h2>Každý dobrý postup začína prvým krokom.</h2><p>Pridajte fotografie, označte detaily a vytvorte zrozumiteľnú návodku.</p><button className="primary" onClick={() => createDocument()}>＋ Vytvoriť prvú návodku</button></div>}<p className="privacy">✓ Údaje a fotografie zostávajú v tomto prehliadači. Pre zálohu použite export projektu.</p></main> : <><div className="document-bar"><button onClick={back}>← Návodky</button><div className="document-title"><strong>{project.title||'Návodka bez názvu'}</strong><small>{project.locked ? "Uzamknutá revízia – iba na čítanie" : saved}</small></div><div className="actions"><button onClick={revise}>＋ Nová revízia</button><button title="Tabuľka textov pre Excel. Fotografie a značky zálohujte cez Uložiť celú návodku (ZIP)." onClick={()=>download(projectCsv(project),(project.title||project.product||'navodka').replace(/[^a-zA-Z0-9_áäčďéíľĺňóôŕšťúýž-]/gi,'_')+'-rev-'+project.revision.replace(/[^a-zA-Z0-9_-]/g,'_')+'.csv','text/csv;charset=utf-8')}>↓ CSV pre Excel</button><button onClick={exportZip}>↓ Uložiť celú návodku (ZIP)</button><button onClick={exportFile}>↓ Export projektu</button><button className="primary" onClick={()=>{requestPrint(false);V(true)}}>Generovať náhľad {project.paperSize||'A3'}</button>{preview&&<button disabled={printLayout?.source!==project||!printLayout?.ready||!printLayout?.fits} onClick={()=>requestPrint(true)}>▤ Tlač / PDF</button>}</div></div><div className="revision-history"><strong>História revízií:</strong> {projects.filter(p=>(p.documentId||p.id)===(project.documentId||project.id)).sort((a,b)=>a.updated-b.updated).map(p=><button key={p.id} onClick={async()=>{try{await flush();const latest=(await listProjects()).find(x=>x.id===p.id);if(latest)open(latest)}catch{E('Uloženie zlyhalo.')}}}>Rev. {p.revision} {p.locked?'🔒':''}</button>)}</div><div className="view-tabs"><button className={!preview ? 'selected' : ''} onClick={() => {requestPrint(false);V(false)}}>Editor návodky</button><button className={preview ? 'selected' : ''} onClick={() => {requestPrint(false);V(true)}}>Náhľad {project.paperSize||'A3'}</button><span>{project.steps.length} krokov · {project.steps.reduce((n, s) => n + s.time, 0)} s celkom</span></div>{preview ? <div className="preview-area"><p className="print-hint">{project.paperSize||'A3'} na výšku · Pri tlači zvoľte „Uložiť ako PDF“, mierku 100 % a vypnite hlavičky a päty prehliadača.</p><Document p={project} onAddPage={project.locked?undefined:()=>edit({maxPages:((project.maxPages||2)+1) as 2|3})} onLayout={(source,ready,fits)=>reportLayout({source,ready,fits})}/></div> : <div className={'workspace '+(project.layoutMode==='free'?'custom-workspace':'')}><aside><nav className="document-sections" aria-label="Časti návodky">{([['header','Hlavička'],['footer','Päta'],['bottom','Spodné časti strán']] as const).map(([key,label])=><button key={key} className={editorSection===key?'active':''} aria-current={editorSection===key?'page':undefined} onClick={()=>{SECTION(key);window.scrollTo({top:0,behavior:'smooth'})}}>{label}</button>)}</nav><div className="aside-title">KROKY POSTUPU <span>{project.steps.length}</span></div>{project.steps.map((s, i) => <div className={'step-nav ' + (editorSection==='step'&&active === s.id ? 'active' : '')} key={s.id}><button className="step-select" onClick={() => {A(s.id);SECTION('step')}}><span className="step-number">{String(i + 1).padStart(2, '0')}</span><span><strong>{s.title}</strong><small>{s.photos.length} fotografií · {s.time} s</small></span></button><div className="step-controls"><button disabled={project.locked} aria-label={`Duplikovať bod ${i+1}`} title="Duplikovať celý bod" onClick={()=>{const copy=duplicateStep(s);const steps=[...project.steps];steps.splice(i+1,0,copy);edit({steps});A(copy.id);SECTION('step')}}>⧉</button><button disabled={project.locked || !i} aria-label={`Krok ${i + 1} nahor`} onClick={() => edit({ steps: moveStep(project.steps, i, i - 1) })}>↑</button><button disabled={project.locked || i === project.steps.length - 1} aria-label={`Krok ${i + 1} nadol`} onClick={() => edit({ steps: moveStep(project.steps, i, i + 1) })}>↓</button><button disabled={project.locked} aria-label={`Vymazať krok ${i + 1}`} onClick={() => { if (confirm('Vymazať krok aj s fotografiami?')) {
        edit({ steps: project.steps.filter(x => x.id !== s.id) });
        if (active === s.id)
            A(project.steps.find(x => x.id !== s.id)?.id || '');
    } }}>×</button></div></div>)}<button disabled={project.locked} className="add-step" onClick={addStep}>＋ Pridať krok</button><div className="aside-note">Jasný postup.<br />Spoľahlivý výsledok.</div></aside><fieldset className="editor" disabled={project.locked}><section className="panel" data-editor-section="header" hidden={editorSection!=='header'}><div className="section-head"><div><div className="eyebrow">DOKUMENT</div><h2>{project.layoutMode==='free'?'Starší vlastný dokument':'Hlavička návodky'}</h2></div><span className="tag">REVÍZIA {project.revision}</span></div><label className="instruction-title-field">Názov návodky<input aria-label="Názov návodky" value={project.title||''} placeholder="Zadajte vlastný názov návodky" onChange={e=>edit({title:e.target.value})}/></label>{project.layoutMode!=='free'&&<><div className="optional-header-editor"><label>Označenie štandardu<textarea aria-label="Označenie štandardu" rows={2} value={project.standardLabel??defaultStandardLabel} onChange={e=>edit({standardLabel:e.target.value})}/></label><label>Materiál / Material (voliteľné)<input aria-label="Materiál / Material" value={project.material||''} placeholder="Nevyplnené pole sa netlačí" onChange={e=>edit({material:e.target.value})}/></label><label>Forma / Mold (voliteľné)<input aria-label="Forma / Mold" value={project.mold||''} placeholder="Nevyplnené pole sa netlačí" onChange={e=>edit({mold:e.target.value})}/></label></div><div className="company-editor"><div><strong>Logo spoločnosti</strong><p>Označenie štandardu zadajte vyššie. Logo sa uloží spolu s návodkou.</p></div>{project.companyLogo&&<img src={project.companyLogo} alt="Nahraté logo spoločnosti"/>}<label className="button">Nahrať logo<input aria-label="Nahrať logo spoločnosti" type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={e=>{addLogo(e.target.files?.[0]);e.target.value=''}}/></label>{project.companyLogo&&<button onClick={()=>edit({companyLogo:''})}>Odstrániť logo</button>}</div><div className="meta-grid full-header-grid">{headerFields.filter(([key])=>key!=='documentNumber').map(([key,sk,en])=><label key={key}>{sk} / {en}<input aria-label={sk+' / '+en} type={key==='date'||key==='issueDate'?'date':'text'} value={project[key]||''} onChange={e=>edit({[key]:e.target.value})}/></label>)}{cycleFields.map(([key,label])=><label key={key}>{label} (s)<input aria-label={label+' (s)'} type="number" min="0" step="any" value={project[key]??''} onChange={e=>edit({[key]:e.target.value===''?undefined:Math.max(0,Number(e.target.value)||0)})}/></label>)}</div></>}<section className="layout-settings"><h3>Nastavenie strán</h3><div className="meta-grid"><label>Formát papiera<select aria-label="Formát papiera" value={project.paperSize||'A3'} onChange={e=>changePaper(e.target.value as 'A3'|'A4')}><option>A3</option><option>A4</option></select></label><label>Počiatočný počet strán<input aria-label="Počiatočný počet strán dokumentu" type="number" min="1" max="200" value={project.maxPages||2} onChange={e=>edit({maxPages:Math.max(1,Math.min(200,Number(e.target.value)||1))})}/></label></div></section>{project.layoutMode==='free'?<p>Tento starší vlastný dokument zostáva zachovaný. Môžete ho zálohovať cez ZIP alebo zobraziť a vytlačiť cez náhľad. Vlastný návrhár bol odstránený.</p>:null}</section><section className="panel" data-editor-section="footer" hidden={editorSection!=='footer'}><div className="eyebrow">DOKUMENT</div><h2>Päta dokumentu</h2><p>Označenie dokumentu sa zobrazí v päte každej strany.</p><label>DOKUMENT no. / Document number<input aria-label="DOKUMENT no. / Document number" value={project.documentNumber||''} onChange={e=>edit({documentNumber:e.target.value})}/></label><p>Pevné označenie vpravo: <strong>SMK7</strong></p></section><section className="panel" data-editor-section="bottom" hidden={editorSection!=='bottom'}><div className="eyebrow">DOKUMENT</div><h2>Spodné časti strán</h2><p>Spoločné textové a obrázkové bloky. Tieto nastavenia sú nezávislé od kontrolných bodov.</p><BottomEditor project={project} onChange={edit} onError={E}/></section>{project.layoutMode==='free'?null:step ? <section className="panel step-editor-panel" data-editor-section="step" hidden={editorSection!=='step'}><div className="section-head"><div><div className="eyebrow">KROK {String(project.steps.indexOf(step) + 1).padStart(2, '0')}</div><h2>Pracovný postup a kontrola</h2></div><span className="tag">{step.photos.length} FOTOGRAFIÍ</span></div><div className="step-fields control-point-fields"><label>Číslo kontrolného bodu<input value={step.pointNumber||''} placeholder={String(project.steps.indexOf(step)+1)} onChange={e=>es({pointNumber:e.target.value})}/></label><label>Názov kroku<input value={step.title} onChange={e => es({ title: e.target.value })}/></label><label>CT (sekundy)<input min="0" type="number" value={step.time} onChange={e => es({ time: Math.max(0, Number(e.target.value) || 0) })}/></label><label>Výsledok<select aria-label="Výsledok" value={step.status} onChange={e => es({ status: e.target.value })}><option value="">Bez označenia</option><option>OK</option><option>NOK</option></select></label></div><label className="separator-editor">Deliaci riadok pred týmto bodom (voliteľné)<input aria-label="Deliaci riadok pred bodom" value={step.separatorBefore||''} placeholder="Napr. PRAVIDELNE OPAKOVANÉ KROKY — nechajte prázdne bez riadku" onChange={e=>es({separatorBefore:e.target.value})}/><small>Vytlačí sa cez celú šírku tabuľky. Vymazaním textu riadok odstránite.</small></label><label className="description">Popis postupu / kontrolné kritériá<textarea rows={3} placeholder="Čo má pracovník urobiť? Na čo si má dať pozor?" value={step.description} onChange={e => es({ description: e.target.value })}/></label><div className="photos-heading"><h3>Fotografie polohy a OK/NOK príklady</h3></div><div className="annotation-tools"><span>OZNAČIŤ</span>{[['select', '↖ Vybrať / upraviť'], ...annotationTools].map(([t, l]) => <button className={tool === t ? 'selected' : ''} key={t} onClick={() => T(t)}>{l}</button>)}<label className="color-label">Farba novej značky<input aria-label="Farba anotácie" type="color" value={color} onChange={e => C(e.target.value)}/></label></div><p className="helper">Zvoľte Vybrať / upraviť, kliknite na značku a upravte ju pod fotografiou. Ťahaním ju presuniete, úchytmi zmeníte veľkosť a otočenie. Pre novú značku zvoľte nástroj.</p><div className="photo-sections">{groups.map(group=><section className={'photo-section group-'+group.key} key={group.key}><div className="photos-heading"><div><h3>{group.title}</h3><p className="helper">{group.help} Šípky, čísla, kruhy aj rámčeky kreslite priamo na fotografiu.</p></div>{uploader(group.key)}</div><div className="photo-grid">{step.photos.filter(p=>photoGroup(p)===group.key).map(photoCard)}</div>{!step.photos.some(p=>photoGroup(p)===group.key)&&<p className="group-empty">Zatiaľ bez fotografie. JPG, PNG alebo WebP do 20 MB.</p>}</section>)}</div></section> : <section className="panel" hidden={editorSection!=='step'}><h2>Pridajte prvý krok</h2><p>Použite tlačidlo vľavo.</p></section>}</fieldset></div>}<div className="actions bottom-document-actions" aria-label="Možnosti návodky dole"><button onClick={revise}>Vytvoriť revíziu</button><button title="Tabuľka textov pre Excel. Fotografie a značky zálohujte cez Uložiť celú návodku (ZIP)." onClick={()=>download(projectCsv(project),(project.title||project.product||'navodka').replace(/[^a-zA-Z0-9_áäčďéíľĺňóôŕšťúýž-]/gi,'_')+'-rev-'+project.revision.replace(/[^a-zA-Z0-9_-]/g,'_')+'.csv','text/csv;charset=utf-8')}>CSV tabuľka</button><button onClick={exportZip}>ZIP záloha</button><button onClick={exportFile}>Projekt JSON</button><button className="primary" onClick={()=>{requestPrint(false);V(true)}}>Vytvoriť {project.paperSize||'A3'} náhľad</button>{preview&&<button disabled={printLayout?.source!==project||!printLayout?.ready||!printLayout?.fits} onClick={()=>requestPrint(true)}>Vytlačiť / uložiť PDF</button>}</div><button className="floating-back-top" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>↑ Hore</button>{!preview&&!project.locked&&project.layoutMode!=='free'&&<button className="floating-add-step" onClick={addStep}>＋ Nový krok</button>}{!preview && <div className="print-only"><Document p={project} onLayout={(source,ready,fits)=>reportLayout({source,ready,fits})}/></div>}</>}</>;
}
createRoot(document.getElementById('root')!).render(<App />);






