# Cohort Reflection Board

## Co se postaví

Interaktivní nástěnka pro reflexi na živých lekcích — studenti anonymně nebo jmenovitě odpovídají na otázky, lektor vidí odpovědi na sdílené obrazovce.

---

## Jak to bude fungovat

### Pro studenty (stránka lekce `/lekce/[slug]`)
- Na konci lekce se zobrazí sekce „Reflexe" s otevřenými otázkami
- Student napíše odpověď a zvolí: *zobrazit jméno* nebo *anonymně*
- Každý může odeslat jednu odpověď na otázku (lze ji upravit, dokud je otevřená)
- Po odeslání se zobrazí potvrzení

### Pro lektora/admina (`/admin` + nová stránka)
- Nová sekce **Reflexe** v admin panelu — seznam všech otázek ze všech lekcí
- Tlačítko **Otevřít / Zavřít** u každé otázky (studenti vidí jen otevřené)
- Odkaz na **Diskuzní pohled** — čistá stránka vhodná pro sdílení obrazovky
- Diskuzní pohled (`/admin/reflexe/[id]`) zobrazuje otázku a všechny odpovědi v přehledném layoutu (automaticky se aktualizuje)

### Odkud přicházejí otázky
- Z Git repozitáře — soubor `activities.json` v adresáři každé lekce
- Formát (jako je ukázán):
  ```json
  { "reflection_board": { "questions": [{ "id": "l1-r1", "question": "Co tě překvapilo?" }] } }
  ```
- Synchronizace probíhá spolu s existující synchronizací Markdown obsahu (tlačítko Sync v adminu)
- Nové otázky se přidají, existující se nesmažou (aby se zachovaly odpovědi)

---

## Implementační kroky

1. **Databáze** — přidat 2 nové tabulky do Convexu:
   - `reflectionQuestions` (id otázky, text, lekce, je-li otevřená)
   - `reflectionAnswers` (odpověď, uživatel, anonymita, čas)

2. **Backend** — nový soubor `convex/reflections.ts` s dotazy a mutacemi (zobrazit otázky, odeslat odpověď, přepnout otevřenou/zavřenou, zobrazit odpovědi)

3. **GitHub sync** — rozšířit existující sync v `convex/github.ts` o načtení `activities.json` z každého adresáře lekce

4. **UI pro studenty** — nová komponenta `components/reflection-board.tsx` integrovaná do stránky lekce

5. **Admin sekce** — přidat správu reflexí do `components/admin-page-content.tsx`

6. **Diskuzní pohled** — nová stránka `/admin/reflexe/[id]` s čistým layoutem pro sdílení obrazovky

---

## Co se NEBUDE dělat (no-gos)

- ❌ Žádné hlasování ani lajky — reflexe není soutěž
- ❌ Žádné mazání odpovědí adminem (zachování psychologické bezpečnosti)
- ❌ Žádné notifikace e-mailem při nové odpovědi
- ❌ Žádné „bodové hodnocení" ani pořadí odpovědí

---

## Technické detaily

- Nové tabulky v `convex/schema.ts`
- Backend logika v `convex/reflections.ts`
- Sync rozšíření v `convex/github.ts`
- Student UI: `components/reflection-board.tsx` → do `components/lecture-page-content.tsx`
- Admin UI: rozšíření `components/admin-page-content.tsx`
- Diskuzní pohled (server shell): `app/admin/reflexe/[id]/page.tsx`
- Diskuzní pohled (client): `components/discussion-view-content.tsx`
