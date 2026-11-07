import {describe,it,expect} from 'vitest';
import {cropFromPoints,validateCrop,layoutAnnotationText} from './photo-text';
describe('orez a text fotografie',()=>{
 it('počíta orez v oboch smeroch',()=>{expect(cropFromPoints({x:80,y:90},{x:20,y:10})).toEqual({x:20,y:10,width:60,height:80})});
 it('odmietne neplatné orezy',()=>{for(const c of [{x:90,y:0,width:20,height:20},{x:0,y:0,width:0,height:20},{x:-1,y:0,width:20,height:20}])expect(()=>validateCrop(c)).toThrow();expect(()=>validateCrop({x:20,y:20,width:80,height:80})).not.toThrow()});
 it('zalamuje text a zmenšuje písmo do poľa',()=>{const r=layoutAnnotationText('Kontrola detailu\nPostup 1',100,60,30);expect(r.lines.length).toBeGreaterThan(1);expect(r.size).toBeLessThan(30);expect(r.fits).toBe(true);expect(r.lines.join(' ')).toContain('Postup')});
});
