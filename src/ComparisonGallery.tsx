import React,{useEffect,useRef,useState} from 'react';
import {type Photo} from './model';
import {Picture} from './Picture';
/** Jediný riadok fotografií: celková výška je limitovaná, pomer strán zostáva zachovaný. */
export function ComparisonGallery({photos}:{photos:Photo[]}){
 const root=useRef<HTMLDivElement>(null);const [sizes,S]=useState<{width:number;height:number}[]>([]);
 useEffect(()=>{const el=root.current;if(!el)return;const images=Array.from(el.querySelectorAll('img'));const calculate=()=>{
  const width=el.getBoundingClientRect().width;const cap=parseFloat(getComputedStyle(el).getPropertyValue('--photo-cap'))||29;
  const ratios=images.map((img,i)=>img.naturalWidth&&img.naturalHeight?(img.naturalWidth/img.naturalHeight)*(photos[i]?.crop?photos[i].crop!.width/photos[i].crop!.height:1):1);const h=Math.max(1,Math.min(cap*96/25.4-4,(width-Math.max(0,photos.length-1)*3-photos.length*4)/Math.max(.01,ratios.reduce((a,b)=>a+b,0))));
  const next=ratios.map(r=>({width:r*h+4,height:h+4}));S(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);
 };const densityObserver=new MutationObserver(calculate);const density=el.closest('[data-density]');if(density)densityObserver.observe(density,{attributes:true,attributeFilter:['data-density']});const observer=new ResizeObserver(calculate);observer.observe(el);images.forEach(img=>img.addEventListener('load',calculate));calculate();return()=>{observer.disconnect();densityObserver.disconnect();images.forEach(img=>img.removeEventListener('load',calculate))};},[photos]);
 return <div className="comparison-gallery" ref={root}>{photos.map((photo,i)=><div className="comparison-gallery-item" key={photo.id} style={{width:sizes[i]?.width||0,height:sizes[i]?.height||0}}><Picture photo={photo}/></div>)}{!photos.length&&<p className="muted">Bez príkladov</p>}</div>;
}
