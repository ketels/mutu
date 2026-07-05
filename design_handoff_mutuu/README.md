# Handoff: Mutu — delningstjänst för verktyg och saker

## Overview
Mutu är en gratis delningstjänst där man lånar ut verktyg och andra saker till människor man litar på. Kärnkonceptet är **skjul**: grupper/kretsar (Vänner, Grannar, Familjen, …) som styr vem som får se och låna vad. En sak kan delas i flera skjul samtidigt. Runt det finns ett komplett låneflöde: förfrågan med önskad period → dialog/motförslag om datum → godkännande → kalender med hämtningar och återlämningar.

Målgrupp: villaägare 35–65 i grannskap. Språk: svenska. Ton: varm men saklig.

## About the Design Files
Filerna i det här paketet är **designreferenser byggda i HTML** — prototyper som visar avsedd form och beteende, INTE produktionskod att kopiera rakt av. Uppgiften är att **återskapa designen i målkodbasens miljö** (React/Next, Vue, native, etc.) med dess etablerade mönster och bibliotek. Om ingen kodbas finns ännu: välj lämpligast stack för en responsiv webbapp (mobil först) och implementera designen där. Föreslå gärna en arkitektur- och implementationsplan innan du börjar koda.

## Fidelity
**High-fidelity.** Färger, typografi, spacing, radier och copy i filerna är avsiktliga och ska återskapas troget. `Mutu Prototyp.dc.html` visar dessutom avsett interaktionsbeteende (klickbar prototyp).

## Files
- `Mutu.dc.html` — statiska hi-fi-skärmar, grupperade per iteration (nyaste överst):
  - **5a** Sakens tillgänglighetskalender (välj period direkt på saksidan)
  - **4a** Lånekalender, desktop (lån som staplar över dagar)
  - **3a** Lånekollen mobil: förfrågan (L1), datumdialog i chatt (L2), pågående lån med progress (L3), månadskalender (L4)
  - **2a** Desktop-vyer: Utforska (D1), Mina saker-matrisen (D2), skjul-detalj (D3)
  - **1a** Mobil grundflöde: Utforska, sak-detalj, Mina saker-matris, lägg till sak, skjul-lista, skjul-detalj, lån
- `Mutu Prototyp.dc.html` — klickbar mobilprototyp med all interaktionslogik (state, flöden, valideringar). **Läs logikklassen i denna fil** — den är den bästa specen för beteendet.

Designfilerna är "Design Components": HTML-mall + en JS-klass (`class Component`) i samma fil. Markupen mellan `<x-dc>`-taggarna och logikklassen är det som ska läsas.

## Informationsarkitektur
Fyra flikar (bottennav på mobil, toppnav på desktop):
1. **Utforska** — allt du kan låna, från alla dina skjul
2. **Mina saker** — det du delar ut, styrt via delningsmatrisen
3. **Skjul** — dina grupper, medlemmar, inbjudningar
4. **Lån** — pågående in-/utlån, förfrågningar, kalender

Profilknapp (avatar-cirkel) i headern på samtliga vyer. Sticky header med logga/rubrik + profil.

## Screens / Views

### 1. Utforska (mobil + desktop D1)
- Logga "mutu" (gemener, 800) + profilavatar.
- Hero-rubrik: "Låna av folk du litar på." + räknare "N saker i dina skjul just nu".
- Sökfält (placeholder "Sök stege, symaskin, släpkärra…").
- Filterchips: "Alla skjul" + ett chip per skjul med färgprick. Aktivt chip: svart bg, vit text.
- Sakkort i 2-kolumns grid (4 kolumner på desktop): foto (grå platta tills riktiga foton finns), namn (15px/700), metarad med skjulfärgprick + "Ägare · avstånd · ledig/utlånad".

### 2. Sak-detalj med tillgänglighet (5a + prototypens sheet)
- Öppnas som bottom-sheet på mobil (drag-handle, slide-up-animation, mörk scrim).
- Foto, namn, ägare + "via <skjul>" + avstånd, beskrivning.
- **Tillgänglighetskalender**: månadsgrid där upptagna dagar är grå med genomstruket datum, passerade dagar nedtonade. Användaren trycker startdag + slutdag → valt spann blir grönt (#2F5D50) sammanhängande block. Val som krockar med upptagna dagar avvisas (toast). Legend "Upptagen / Ditt val".
- "Ditt val"-kort med period + antal dagar.
- Fritextfält "Meddelande till <förnamn>" med placeholder; eget meddelande ersätter standardhälsningen i chatten.
- CTA: "Fråga <förnamn> · <period>" (grön). Inaktiv (grå #C9C8C0) tills period vald, label "Välj period först".

### 3. Låneförfrågan & chatt (3a L1–L2 + prototyp)
- Förfrågan skapar en chatt-tråd: systemnotis ("Förfrågan skickad · datum"), användarens bubbla (svart, höger), **periodkort** (vit ram, "Önskad period" + datum), skrivindikator, ägarens svar (ljusgrå, vänster).
- **Motförslag** renderas som kort med grön ram: "<Namn> föreslår" + period + knappar "Funkar!" (grön) / "Annat datum". Accept → kortet byts till "✓ Godkänt — ligger nu i din kalender" och lånet dyker upp i Lån + kalendern.
- Chatthuvud: tillbaka-pil, avatar, ägarnamn, sakens namn. Meddelandefält längst ner.

### 4. Mina saker — delningsmatrisen (1a/2a D2 + prototyp)
Signaturmönstret. Rad = egen sak, kolumn = skjul, cell = rund toggle.
- Ifylld cell: skjulets färg + vit bock. Tom: 1.5px ram #D8D7CF.
- Mobil med >3 skjul: **horisontell scroll** — sakkolumnen (168px) sticky till vänster med opak bakgrund + 14px gradient-fade i högerkanten; skjulkolumner à 62px; gradient i vyns högerkant signalerar mer innehåll.
- Sakrad: namn (15px/700) med ›-chevron + statusrad ("Hemma", "Utlånad till Jonas t.o.m. sön", "Delas inte än").
- **Tryck på sak → Ändra sak-vy**: foto (byt), namn, beskrivning, skjul-checklista (samma stil som Lägg till), statusrad "Syns i N skjul. Ändringar sparas direkt.", destruktiv knapp "Ta bort från Mutu" (röd-brun text, ljus ram).
- Desktop: full tabell med foto-, sak-, status- och skjulkolumner.

### 5. Lägg till sak (1a)
Foto-yta (streckad ram, "Ta ett foto"), namnfält, skjul-checklista (vald rad = skjulets ljusa bg + färgade ram + ifylld bock), förklaringstext "Bara medlemmar i valda skjul ser saken…", CTA "Dela <sak>". Kräver namn + minst ett skjul.

### 6. Skjul (1a + 2a D3 + prototyp)
- Lista: kort per skjul med färgprick, namn, meta ("N personer · N saker · du delar N"), avatarstack. "+ Nytt skjul" (streckad).
- Detalj: tillbaka, färgprick + namn, "Bjud in"-knapp (kopierar länk → toast), avatarstack, "Du delar hit" som chips i skjulets ljusa färg, "I skjulet" som radlista (foto, namn, ägare · avstånd · status).
- Desktop: personer i vänsterkolumn (namn, adress, antal delade saker), saker i grid till höger; egna saker märkta "DIN"-badge.

### 7. Lån (3a L3 + prototyp)
- Header med "Kalender/Lista"-växlare + profil.
- Åtgärdsbanner överst vid händelse idag: "Lämna tillbaka idag" (röd-brun ram #9A4F38, ljus bg #FAF1EE) med "Klart ✓"-knapp → bekräftelserad + toast.
- Sektioner "Du lånar" / "Du lånar ut". Lånekort: foto, titel ("Sak ← Ägare" / "Sak → Låntagare"), period, statuspill (GODKÄNT grön/EEF2F0, PÅGÅR/UTLÅNAD ockra/F5EFE6, VÄNTAR ockra, NYTT FÖRSLAG vit på röd-brun, SVARA vit på svart), progressbar "Dag X av Y" + "Lämnas/Hem <dag>".
- Inkommande förfrågan inline: avatar, "<Namn> vill låna <sak>", citatbubbla, "Låna ut" (grön) / "Kan inte".
- Notisprick (röd-brun, på Lån-tabbens ikon) när nytt svar/förslag finns.

### 8. Kalender (3a L4 + 4a desktop)
- Mobil: månadsgrid med max 3 färgprickar per dag (skjulfärger), idag = svart platta med vit text. Under: "Idag"-sektion + "Kommande" som radlista med färgprick, titel ("Hämta stegen hos Berit"), datum.
- Desktop (4a): lån ritas som **staplar över sina dagar** i skjulets färg; stapel fortsätter över veckoskifte (radie klipps i skarven); streckad ram = obesvarad förfrågan; idag-kolumn tonad + dagsnummer i svart pill. Högerkolumn: dagens åtgärd + kommande.

## Interactions & Behavior
- Bottom-sheet: scrim rgba(25,25,24,.4) fade .2s; sheet slide-up .3s cubic-bezier(.2,.9,.3,1).
- Vy-byten: fade .2s. Chattbubblor: slide-up .25s.
- Toast: svart pill ovanför tabbaren, slide-up, auto-dismiss ~2,6s. Används för: kopierad inbjudningslänk, ogiltigt datumval, återlämning bekräftad, lån i kalendern.
- Periodval: första tryck = start, andra (senare, utan krock) = slut; tryck före start eller efter avslutat val = ny start.
- Simulerat ägarsvar i prototypen efter ~1,9s (skrivindikator ••• under tiden) — i produktion realtid/push.
- Aktiv-states: opacity .6–.7 eller scale(.97–.98) på tryckbara kort.

## State Management (från prototypens logikklass)
- `tab`, `openItemId` (sheet), `chatFor` (chatt-tråd), `activeShedId`, `editItemId`
- `selStart`/`selEnd` (periodval), `itemMsg` (eget meddelande)
- `chats: { [itemId]: { msgs, status: 'väntar'|'förslag'|'godkänt', range } }`
- `myShared: { [itemId]: shedId[] }` — matrisens sanning; speglas i skjul-detaljens chips och "du delar N"
- `myNames`/`myDescs` (redigering), `returned`, `sara` (inkommande förfrågan), `lanBadge`, `toast`
- Datamodell i praktiken: User, Shed (medlemmar), Item (ägare, foto, beskrivning, delad-i-skjul[]), Loan/Request (item, låntagare, period, status, meddelanden), CalendarEvent (härledd ur Loans).

## Design Tokens
**Färger**
- Bakgrund app: `#FBFBF8` · canvas/desktop-bg: `#EFEEE8` · kortyta: `#FFFFFF`
- Text: `#191918` (primär), `#45453F` (brödtext), `#71716A` (sekundär), `#9B9B92` (svag), `#C9C8C0`/`#B4B3AA` (inaktiv)
- Ramar: `#E0DFD8` (standard), `#E9E8E2` (divider), `#F0EFEA` (svag divider), `#D8D7CF` (streckad/tom toggle)
- Fotoplatta: `#E9E8E2` · upptagen dag: `#EDECE5`
- **Skjulfärger**: Vänner `#2F5D50` (ljus `#EEF2F0`), Grannar `#A66A2C` (ljus `#F5EFE6`), Familjen `#9A4F38` (ljus `#FAF1EE`), Bokklubben `#39586B` (ljus `#EAEEF2`), Kollegorna `#66603B` (ljus `#F1EFE3`). Nya skjul tilldelas färg ur denna dova, jordnära skala.
- Primär CTA/godkänn: `#2F5D50` · inaktiv CTA: `#C9C8C0` · varning/åtgärd: `#9A4F38` · neutral CTA/idag: `#191918`

**Typografi**
- Familj: **Schibsted Grotesk** (Google Fonts), genomgående.
- Skala: 34px/800 desktop-rubrik · 25–26px/800 mobilrubrik · 22px/800 undersida · 15–15.5px/700 kortrubrik · 14–14.5px brödtext · 12–13px sekundärt · 11–12px/700 versal etikett (letter-spacing .07em) · 11.5px/800 statuspill.
- Rubriker: letter-spacing -0.03em.

**Form**
- Radier: 999px (pills/chips/knappar), 24–28px (telefonram/sheet), 14–16px (kort), 10–12px (fält, små knappar), 8–9px (kalenderdagar).
- Skuggor: kort `0 12px 40px rgba(25,25,24,.08)`; prototypram `0 24px 70px rgba(25,25,24,.16)`. Inga skuggor på småelement.
- Touch-ytor ≥ 44px. Tabbar: vit, blur, 1px toppdivider.

## Responsivt
Mobil först (390px design). Desktop (1440px): toppnav ersätter tabbar, grid 4 kolumner, matrisen blir full tabell, kalendern får stapel-layout + sidokolumn. Brytpunkt förslagsvis ~768–900px.

## Assets
Inga riktiga bilder ännu — alla foton är grå plattor med etikett (`foto: <sak>`). Produktionen behöver användaruppladdade foton (kamera på mobil). Ikonografi i skisserna är avsiktligt minimal (geometriska former/tecken); välj ett stramt ikonbibliotek (t.ex. Lucide) med 2px stroke.

## Öppna frågor (bra att låta Claude Code resonera om i planen)
- Onboarding och att skapa/gå med i skjul via inbjudningslänk (design finns ej ännu)
- Notiser (push/mail) för förfrågningar och återlämningsdagar
- Vad händer vid försenad återlämning
- Auth och adress-/avståndshantering
