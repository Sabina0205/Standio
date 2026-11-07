# Standio

Slovenský editor výrobných a kontrolných návodiek. React + TypeScript + Vite, lokálne ukladanie v IndexedDB. Bez backendu a bez prihlasovania.

## Používanie
Vytvorte návodku, vyberte A4 alebo A3 na výšku a počiatočný počet strán. Ďalšie strany sa pridajú automaticky podľa obsahu. Hlavička, päta a spodné časti strán sa upravujú oddelene od kontrolných bodov.

Body môžete presúvať, duplikovať a mazať. Každý bod má čas, popis, fotografie polohy a zeleno/červeno označené príklady OK/NOK. Fotografie podporujú vratný orez, upraviteľné značky, texty a duplikovanie značiek. Spodné bloky môžu mať viac riadkov.

Generovať náhľad zobrazí návodku bez tlačového okna. Tlač / PDF vytvorí výstup vo vybranom formáte. Pri tlači vypnite hlavičky a päty prehliadača, zapnite farby pozadia a použite mierku 100 %.

Uložiť celú návodku (ZIP) je úplná záloha vrátane fotografií, orezov a značiek. Nahrať návodku / zálohu ju načíta na ďalšie úpravy. CSV je doplnkový export textov pre Excel. Revíziu zadávate ručne; Nová revízia uchová a uzamkne predchádzajúcu návodku.

Podrobný postup: [SUBORY-A-REVIZIE.md](SUBORY-A-REVIZIE.md).

## GitHub Pages
Projekt obsahuje `.github/workflows/pages.yml`. V repozitári nastavte Settings → Pages → Build and deployment → Source na GitHub Actions. Push do vetvy main spustí testy, zostavenie a publikovanie stránky.

Na GitHub sa nahráva aplikácia. Návodky a fotografie vytvorené v prehliadači sa automaticky na GitHub neposielajú. Lokálne úložisko je viazané na konkrétny prehliadač a adresu. Na prenos medzi počítačmi alebo z lokálnej adresy na web použite ZIP.

## Lokálne spustenie
Vyžaduje Node.js. Po stiahnutí zdrojov:

```sh
npm ci
npm run build
node serve.mjs
```

Potom otvorte http://127.0.0.1:5173. Na Windows môžete po zostavení použiť Spustit.cmd.

Vývoj: `npm run dev`. Dátové testy: `npm test`. Kontroly prehliadača: `npx playwright test` (vyžadujú Chrome; konfigurácia lokálne používa npm.cmd).
