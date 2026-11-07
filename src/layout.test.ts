import {it,expect} from 'vitest';
import {newProject,parseProject} from './model';
import {exportBundle,importBundle} from './bundle';
import {layoutText} from './layout';
it('vlastný layout, šablóna, jedna strana a vypnuté spodky zostanú v ZIP',()=>{const p=newProject();p.maxPages=1;p.isTemplate=true;p.layoutMode='free';p.bottomEnabled=[false,true];p.layoutBlocks=[{id:'layout-text',page:1,x:10,y:20,width:100,height:40,type:'text',text:'Produkt {{product}}',background:'#ffffff',color:'#000000',fontSize:20}];expect(importBundle(exportBundle(p))).toEqual(p);p.product='ABC';expect(layoutText(p.layoutBlocks[0].text,p)).toBe('Produkt ABC');p.layoutBlocks[0].width=999;expect(()=>parseProject(JSON.stringify(p))).toThrow()});
