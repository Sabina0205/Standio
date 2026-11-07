export const annotationTools=[
 ['circle','◯ Kruh'],['arrow','↗ Šípka'],['rect','▭ Obdĺžnik'],['number','① Číslo'],
 ['line','— Čiara'],['dashedLine','┄ Prerušovaná čiara'],['doubleArrow','↔ Obojstranná šípka'],['triangle','△ Trojuholník'],['text','T Textové pole'],
] as const;
export const annotationTypes=annotationTools.map(([type])=>type);
export const annotationLabels:Record<string,string>=Object.fromEntries(annotationTools.map(([type,label])=>[type,label.slice(label.indexOf(' ')+1)]));
export const isLinearMark=(type:string)=>['arrow','line','dashedLine','doubleArrow'].includes(type);
