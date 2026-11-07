import type {Photo} from './model';
export type PhotoCrop={x:number;y:number;width:number;height:number};
export const fullCrop:PhotoCrop={x:0,y:0,width:100,height:100};
export function validateCrop(crop:Photo['crop']){if(crop===undefined)return;if(!crop||!['x','y','width','height'].every(k=>Number.isFinite(crop[k as keyof PhotoCrop]))||crop.x<0||crop.y<0||crop.width<1||crop.height<1||crop.x+crop.width>100.00001||crop.y+crop.height>100.00001)throw Error('Neplatný orez fotografie.');}
export function cropFromPoints(a:{x:number;y:number},b:{x:number;y:number}):PhotoCrop{return{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y)}}
let context:CanvasRenderingContext2D|null=null;
function measure(text:string,size:number,bold:boolean){if(typeof document!=='undefined'){context||=document.createElement('canvas').getContext('2d');if(context){context.font=(bold?'bold ':'')+size+'px Arial';return context.measureText(text).width}}return text.length*size*.6}
export function layoutAnnotationText(text:string,width:number,height:number,requestedSize:number,bold=false){
 const wrap=(size:number)=>{const lines:string[]=[];for(const paragraph of text.replaceAll('\r','').split('\n')){if(!paragraph){lines.push('');continue}let line='';for(const word of paragraph.split(/\s+/)){if(measure((line?line+' ':'')+word,size,bold)<=width){line+=(line?' ':'')+word;continue}if(line){lines.push(line);line=''}for(const char of word){if(line&&measure(line+char,size,bold)>width){lines.push(line);line=''}line+=char}}lines.push(line)}return lines};
 let size=requestedSize,lines=wrap(size);while(size>8&&lines.length*size*1.2>height){size=Math.max(8,size-1);lines=wrap(size)}return{lines,size,fits:width>0&&height>0&&lines.length*size*1.2<=height};
}
