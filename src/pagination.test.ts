import {it,expect} from 'vitest';
import {fitTwoPages} from './pagination';
it('počet bodov nie je pevný: krátke body sa rozdelia podľa výšky',()=>{expect(fitTwoPages(Array(20).fill(10),110,110)).toBe(11);expect(fitTwoPages(Array(6).fill(10),110,110)).toBe(6)});
it('rôzne vysoké body sa rozdelia bez zmeny poradia',()=>{expect(fitTwoPages([80,20,20,20,20],85,100)).toBe(1);expect(fitTwoPages([20,20,20,20,80],100,85)).toBe(4)});
it('nepridáva tretiu stranu a odmietne obsah, ktorý sa nezmestí',()=>{expect(fitTwoPages([110],100,100)).toBeNull();expect(fitTwoPages([60,60,60],100,100)).toBeNull();expect(fitTwoPages([],100,100)).toBe(0)});

it('dva malé body zostanú spolu na prvej strane',()=>{expect(fitTwoPages([100,100],1000,1000)).toBe(2);expect(fitTwoPages([400,400,400],1000,1000)).toBe(2)});
