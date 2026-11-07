/** Zaplní strany v poradí; čísla sú koncové indexy bodov jednotlivých strán. */
export function fitPageEnds(heights:number[],capacities:number[]):number[]|null{
 if(!capacities.length||capacities.some(c=>!Number.isFinite(c)||c<0)||heights.some(h=>!Number.isFinite(h)||h<0))return null;
 const ends:number[]=[];let index=0;
 for(const capacity of capacities){let used=0;while(index<heights.length&&used+heights[index]<=capacity){used+=heights[index++]}ends.push(index)}
 return index===heights.length?ends:null;
}
export function fitTwoPages(heights:number[],firstCapacity:number,secondCapacity:number):number|null{return fitPageEnds(heights,[firstCapacity,secondCapacity])?.[0]??null}
