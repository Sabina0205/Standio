# Standio – používanie a zálohy

## Nová návodka
Na úvodnej obrazovke vyberte A4 alebo A3 na výšku a počiatočný počet strán. Nová návodka používa hlavnú tabuľkovú šablónu. Formát a počiatočný počet strán môžete neskôr zmeniť v Nastavenie strán.

Kontrolné body sa ukladajú na prvú stranu, až po jej zaplnení na ďalšiu. Strany navyše sa pridávajú automaticky. Praktický ochranný limit je 200 strán. Jeden kontrolný bod sa nerozdeľuje: ak je sám väčší než tlačiteľná plocha, treba ho rozdeliť na menšie body. V takom prípade aplikácia upozorní a zablokuje tlač.

Hlavička hlavnej šablóny má dva riadky. Materiál a forma sú voliteľné. Označenie štandardu a názov návodky sú samostatné od procesu. Revíziu zadávate ručne. V päte je vlastné DOKUMENT no. a SMK7.

Body presuniete šípkami ↑/↓ vľavo, × vymaže celý bod po potvrdení. Deliaci riadok pred bodom je voliteľný a presúva sa s bodom. Ručne zadané čísla bodov sa nemenia.

Fotografie sú rozdelené na polohu kusu a farebne orámované príklady OK/NOK. Nástroje na značky zahŕňajú čiary, šípky, kruh, obdĺžnik, trojuholník, číslo a text. Značky môžete vybrať, presúvať, meniť veľkosť, farby a otočenie, duplikovať alebo odstrániť. Textové pole má nastaviteľnú výplň a farbu písma. Orez fotografie uchováva originál; Obnoviť celú fotografiu ho vráti.

## Spodné bloky
V Textové a obrázkové bloky dole na stranách môžete samostatne zapnúť prvú stranu a ďalšie strany. Vypnutím sa obsah nevymaže. Pridávajte texty a fotografie, farby, rámy, šírky a poradie blokov. Druhá konfigurácia sa opakuje na všetkých stranách od druhej. Výška zapnutých blokov sa započíta do rozloženia.

## Súbory a revízie
1. Uložiť celú návodku (ZIP) je úplná prenosná záloha. Obsahuje údaje, fotografie, značky, orez aj nastavenie layoutu. Názov súboru vychádza z názvu návodky a revízie.
2. Generovať náhľad zobrazí náhľad bez tlačového okna. Tlač / PDF potom otvorí tlač zvoleného A4/A3. Vypnite hlavičky a päty prehliadača, zapnite farby pozadia a použite mierku 100 %.
3. Nahrať návodku / zálohu obnoví ZIP bez rozbaľovania ako upraviteľnú kópiu.
4. Nová revízia vyžiada nové označenie, uzamkne predchádzajúcu návodku a vytvorí novú. Zachovajte ZIP aj PDF predchádzajúcich revízií.

CSV pre Excel je doplnková tabuľka údajov hlavičky, textov, časov a deliacich riadkov. Samotné CSV nemá fotografie ani vlastný vizuál šablóny. Na úplnú zálohu používajte ZIP alebo JSON. Ak upravujete CSV vo vnútri ZIP, zachovajte názvy stĺpcov, ID krokov, UTF-8 a oddeľovač bodkočiarka. navodka.csv a navodka.json musia zostať v koreni balíka.

PDF slúži na čítanie a tlač, nedá sa načítať ako upraviteľný projekt. Úplnú zálohu knižnice vytvoríte cez Záloha celej knižnice.

## Skúška prenosu na jednom počítači
Uložte ZIP. Otvorte anonymné okno prehliadača (Chrome/Edge: Ctrl+Shift+N), otvorte tú istú adresu aplikácie a nahrajte ZIP. Anonymné okno nemá pôvodnú lokálnu databázu, takže simuluje iný počítač. Skontrolujte fotografie, značky, orez, texty, revíziu a náhľad. Zmeny v anonymnom okne pred zatvorením uložte do ZIP.

Doma aj v práci používajte rovnaký editor a prenášajte ZIP. Samotné údaje sa medzi počítačmi nesynchronizujú. Lokálne ukladanie je pracovná kópia; zálohou je stiahnutý súbor. Adresa 127.0.0.1 funguje na počítači, kde beží Spustit.cmd. Web možno neskôr sprístupniť statickým hostingom. Supabase pre tento spôsob práce nie je potrebný. Import podporuje súbor do 150 MB.


## Duplikovanie bodov
V ľavom zozname použite ⧉. Kópia sa vloží hneď za pôvodný bod a otvorí sa na úpravu. Uchová texty, čas, fotografie, orez, deliaci riadok a značky. Je nezávislá od originálu. Vlastné číslo bodu sa vyprázdni a použije nové automatické poradie.

Vlastný návrhár a sekcia šablón boli odstránené. Predvolená hlavná návodka je naďalej dostupná cez Nová návodka. Staršie uložené vlastné dokumenty zostali zachované pre náhľad, tlač a export zálohy; ich návrhár už nie je dostupný.

## Oddelené časti editora
Vľavo nad kontrolnými bodmi sú Hlavička, Päta a Spodné časti strán. Hlavička obsahuje názov návodky, firemné údaje, logo a nastavenie A4/A3. Päta obsahuje DOKUMENT no. a pevné SMK7. Spodné časti strán obsahujú spoločné textové a obrázkové bloky. Kliknutie na bod zobrazí iba jeho obsah. Pridať krok a Duplikovať bod automaticky prepnú na daný bod; spoločné nastavenia zostanú uložené. Tlačové rozloženie sa nemení.

## Riadky spodných častí
Bloky sa predvolene ukladajú do jedného riadku. Pridať riadok vytvorí ďalší riadok samostatne pre prvú alebo ďalšie strany. Nové textové a obrázkové bloky patria do posledného riadku; pole Riadok pri každom bloku umožňuje presun do iného riadku. Odobrať posledný riadok presunie jeho obsah do predchádzajúceho bez vymazania. Nastavenie sa zachováva v ZIP/JSON aj revíziách. Šírky v rámci riadku zostávajú pomerné; ak ich súčet prekročí 100 %, zmenšia sa tak, aby sa bloky nezalamovali do nevyžiadaného riadku. Prázdne riadky sa netlačia. Výška neprázdnych riadkov sa započítava pri automatickom stránkovaní.
