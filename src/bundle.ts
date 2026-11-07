import {additionalHeaderKeys,headerFields,cycleFields,standardFields} from './header';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
import {type Project,newStep,newProject,parseProject} from './model';
export function importCsv(raw:string):Project { const [, ...rows]=readCsv(raw); const p=newProject(); p.steps=rows.filter(r=>r[0]).map(r=>({...newStep(),id:r[0]})); return applyCsv(p,raw); }
const legacyColumns=['ID kroku','Produkt','Proces','Revízia','Autor','Dátum','Názov kroku','Popis','Čas (s)','Výsledok','Fotografie'];
const headerColumns=[...legacyColumns,...additionalHeaderKeys.map(k=>headerFields.find(f=>f[0]===k)![1])];
const pointColumns=[...headerColumns,'Číslo kontrolného bodu'];
const titleColumns=[...pointColumns,'Názov návodky'];
const cycleColumns=[...titleColumns,...cycleFields.map(f=>f[1]+' (s)')];
const standardColumns=[...cycleColumns,...standardFields.map(f=>f[1])];
const columns=[...standardColumns,'Deliaci riadok pred bodom'];
// Apostrof chráni text pred spustením vzorca v tabuľkovom programe.
const safe=(s:string)=>/^[\s]*[=+@-]/.test(s)||s.startsWith("'")?"'"+s:s;
const restore=(s:string)=>s.startsWith("'")&&(/^[\s]*[=+@-]/.test(s.slice(1))||s.slice(1).startsWith("'"))?s.slice(1):s;
const quote=(s:string)=>'"'+safe(s).replaceAll('"','""')+'"';
export function projectCsv(p:Project){
 const rows=(p.steps.length?p.steps:[null]).map(s=>[s?.id||'',p.product,p.process,p.revision,p.author,p.date,s?.title||'',s?.description||'',String(s?.time||0),s?.status||'',s?.photos.map(f=>f.name).join(' | ')||'',...additionalHeaderKeys.map(k=>p[k]||''),s?.pointNumber||'',p.title||'',...cycleFields.map(([key])=>p[key]===undefined?'':String(p[key])),...standardFields.map(([key])=>p[key]||''),s?.separatorBefore||'']);
 return '\uFEFF'+[columns,...rows].map(row=>row.map(quote).join(';')).join('\r\n')+'\r\n';
}
export function readCsv(raw:string):string[][]{
 const text=raw.replace(/^\uFEFF/,'');const rows:string[][]=[];let row:string[]=[],value='',quoted=false,closed=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){value+='"';i++}else {quoted=false;closed=true}}else value+=c;continue}
  if(c==='"'&&!value&&!closed){quoted=true;continue}
  if(c===';'||c==='\r'||c==='\n'){row.push(restore(value));value='';closed=false;if(c!==';'){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(v=>v!==''))rows.push(row);row=[]}continue}
  if(closed)throw Error('Neplatné CSV: znak za uzavretými úvodzovkami.');value+=c;
 }
 if(quoted)throw Error('Neplatné CSV: neuzavreté úvodzovky.');
 if(value||row.length||closed){row.push(restore(value));if(row.some(v=>v!==''))rows.push(row)}return rows;
}
export function applyCsv(p:Project,raw:string):Project{
 const [header,...rows]=readCsv(raw);const schema=header?.length===legacyColumns.length?legacyColumns:header?.length===headerColumns.length?headerColumns:header?.length===pointColumns.length?pointColumns:header?.length===titleColumns.length?titleColumns:header?.length===cycleColumns.length?cycleColumns:header?.length===standardColumns.length?standardColumns:columns;if(!header||header.length!==schema.length||!header.every((s,i)=>s===schema[i])||!rows.length)throw Error('CSV nemá očakávané stĺpce. Zachovajte hlavičku exportovaného CSV.');
 const seen=new Set<string>();const first=rows[0];const next=structuredClone(p);[next.product,next.process,next.revision,next.author,next.date]=first.slice(1,6);
 if(schema.length>=titleColumns.length&&(first[22]||'title' in next))next.title=first[22];
 if(schema!==legacyColumns)additionalHeaderKeys.forEach((k,i)=>{if(first[11+i]||k in next)next[k]=first[11+i]});
 if(schema.length>=cycleColumns.length)cycleFields.forEach(([key],i)=>{const value=first[23+i];if(value===''){delete next[key]}else{const n=Number(value.replace(',','.'));if(!Number.isFinite(n)||n<0)throw Error('Neplatný čas dokumentu v CSV.');next[key]=n}});
 if(schema.length>=standardColumns.length)standardFields.forEach(([key],i)=>{if(first[26+i]||key in next)next[key]=first[26+i]});
 next.steps=[];
 for(const row of rows){if(row.length!==schema.length)throw Error('Nesprávny počet stĺpcov v CSV.');if(!row.slice(1,6).every((v,i)=>v===first[i+1]))throw Error('Hlavička návodky musí byť rovnaká vo všetkých riadkoch CSV.');
  if(schema!==legacyColumns&&!row.slice(11,11+additionalHeaderKeys.length).every((v,i)=>v===first[11+i]))throw Error('Hlavička návodky musí byť rovnaká vo všetkých riadkoch CSV.');
  if(schema.length>=titleColumns.length&&row[22]!==first[22])throw Error('Názov návodky musí byť rovnaký vo všetkých riadkoch CSV.');
  if(schema.length>=cycleColumns.length&&!row.slice(23,26).every((v,i)=>v===first[23+i]))throw Error('Časy dokumentu musia byť rovnaké vo všetkých riadkoch CSV.');
  if(schema.length>=standardColumns.length&&!row.slice(26,29).every((v,i)=>v===first[26+i]))throw Error('Voliteľné údaje hlavičky musia byť rovnaké vo všetkých riadkoch CSV.');
  if(!row[0]&&!row[6]&&!row[7])continue;
  const original=p.steps.find(s=>s.id===row[0]);if(row[0]&&!original)throw Error('CSV obsahuje neznáme ID kroku. Pre nový krok nechajte ID prázdne.');
  const s=original?structuredClone(original):newStep();if(seen.has(s.id))throw Error('Duplicitné ID kroku v CSV.');seen.add(s.id);
  const time=Number(row[8].replace(',','.'));if(!Number.isFinite(time)||time<0||!['','OK','NOK'].includes(row[9]))throw Error('Neplatný čas alebo výsledok v CSV.');
  if(schema.length>=pointColumns.length&&(row[11+additionalHeaderKeys.length]||'pointNumber' in s))s.pointNumber=row[11+additionalHeaderKeys.length];
  if(schema===columns&&(row[29]||'separatorBefore' in s))s.separatorBefore=row[29];
  next.steps.push({...s,title:row[6],description:row[7],time,status:row[9]});
 }
 return parseProject(JSON.stringify(next));
}
export function exportBundle(p:Project):Uint8Array{
 const files:Record<string,Uint8Array>={};const manifest=structuredClone(p);
 for(const step of manifest.steps)for(const photo of step.photos){
  const match=/^data:image\/(png|jpeg|webp);base64,(.*)$/s.exec(photo.src);if(!match)throw Error('Neplatná fotografia.');
  const path=`fotografie/${photo.id}.${match[1]==='jpeg'?'jpg':match[1]}`;
  files[path]=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));photo.src=path;
 }
 files['navodka.json']=strToU8(JSON.stringify(manifest,null,2));files['navodka.csv']=strToU8(projectCsv(p));
 files['PRECITAJTE-MA.txt']=strToU8('CELÁ NÁVODKA\n\nnavodka.csv: upravujte texty, čas a OK/NOK v Exceli. Použite UTF-8 a oddeľovač bodkočiarka. ID kroku a názvy stĺpcov zachovajte. Údaje hlavičky musia byť rovnaké v každom riadku. Poradie riadkov určuje poradie krokov.\n\nFotografie sú v priečinku fotografie. Navodka.json uchováva ich priradenie, pôvodné názvy a grafické značky. Stĺpec Fotografie v CSV je informatívny; priradenie fotiek meňte v editore.\n\nNa návrat do editora zabaľte upravené súbory do ZIP (navodka.csv a navodka.json musia byť priamo v koreni ZIP) a použite Importovať projekt. Import vytvorí kópiu a zachová pôvodnú návodku.\n');
 return zipSync(files,{level:1});
}
export function importBundle(bytes:Uint8Array):Project{
 let total=0,count=0;const files=unzipSync(bytes,{filter:f=>{
  total+=f.originalSize;count++;if(total>200*1024*1024||f.originalSize>100*1024*1024||count>2000)throw Error('ZIP je príliš veľký.');
  if(f.name.includes('..')||f.name.startsWith('/')||f.name.includes('\\'))throw Error('Neplatná cesta v ZIP.');return true;
 }});
 if(!files['navodka.json']||!files['navodka.csv'])throw Error('V ZIP chýba navodka.json alebo navodka.csv.');
 const p=JSON.parse(strFromU8(files['navodka.json']));if(!Array.isArray(p.steps))throw Error('Neplatná návodka v ZIP.');
 for(const s of p.steps){if(!Array.isArray(s.photos))throw Error('Neplatné fotografie v ZIP.');for(const f of s.photos){if(typeof f.src!=='string'||!/^fotografie\/[a-zA-Z0-9-]+\.(png|jpg|webp)$/.test(f.src)||!files[f.src])throw Error('V ZIP chýba fotografia alebo má neplatnú cestu.');const data=files[f.src];if(data.length>20*1024*1024)throw Error('Fotografia presahuje 20 MB.');const ext=f.src.split('.').pop();let binary='';for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));f.src=`data:image/${ext==='jpg'?'jpeg':ext};base64,${btoa(binary)}`}}
 return applyCsv(parseProject(JSON.stringify(p)),strFromU8(files['navodka.csv']));
}

