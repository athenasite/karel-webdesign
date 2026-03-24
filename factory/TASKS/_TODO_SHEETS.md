# 🎯 Strategisch Doel: De Google Sheets "Holy Grail" (v8.8 - Maart 2026)

Dit document is de centrale referentie voor het ultieme doel van de Athena CMS Factory: **volledig site-beheer via Google Sheets voor de eindgebruiker.**

## 🏁 De Visie
Een systeem waarbij de techniek (React/Vite/Tailwind) volledig is losgekoppeld van de inhoud. De gebruiker past prijzen, teksten of afbeeldingen aan in een vertrouwde Google Sheet, en de website wordt automatisch bijgewerkt zonder dat er een developer of code aan te pas komt.

## 📊 Huidige Status (Maart 2026 - Zenith State)

### 1. Wat al werkt (De "Plumbing")
*   **Consolidated Data Pipeline:** `DataManager.js` regelt nu zowel `syncFromSheet` als `syncToSheet`. De oude losse scripts zijn geconsolideerd.
*   **Auto-Provisioning:** `auto-sheet-provisioner.js` maakt automatisch nieuwe Sheets aan met de juiste tabbladen op basis van de blueprint.
*   **Navigation Builder:** Volledig visueel menu-beheer via `navigation.json` en de Dock, gesynchroniseerd met Sheets.
*   **3.0 Triad Storage:** De "Vorkheftruck" in de Middleware zorgt voor veilige (de)hydratatie bij het parkeren van sites.

### 2. Recente Doorbraken (v8.1 - v8.8)
*   **Shift+Click Edit Standard:** Een uniforme manier om elementen te selecteren en bewerken in de Dock.
*   **Vault Isolation:** Productie-data is nu fysiek gescheiden van de Factory, wat overschrijven van Sheets-data door 'factory-wide fixes' voorkomt.
*   **Style/Content Separation:** Volledige scheiding tussen `site_settings.json` (inhoud) en `style_config.json` (vormgeving).

### 3. Status per Track
*   **SPA Sites:** **100% Klaar.** Volledig stabiel en productie-klaar.
*   **MPA Sites (Hydra):** **85% Klaar.** Werkt technisch goed, focus ligt nu op schaalbaarheid in de kluis.

---

## 🚀 De "Last Mile" (Nog te doen)

### 🟦 [DOCK] Naadloze Publicatie
De verbinding tussen de Dock en de Vault moet nog strakker.
- [ ] Implementeer een visuele status-indicator in de Dock die aangeeft of de lokale data synchroon loopt met de Google Sheet.
- [ ] Voeg ondersteuning toe voor "Conflict Resolution" (wat als de Sheet is aangepast én de Dock?).

### 🟩 [AUTOMATISERING] Webhooks & Cloud Sync
De gebruiker moet niet afhankelijk zijn van de lokale Chromebook om wijzigingen uit de Sheet live te zetten.
- [ ] Onderzoek: Kan een GitHub Action direct getriggerd worden door een wijziging in Google Sheets (zonder tussenkomst van de fabriek)?
- [ ] Automatiseer de `fetch-data -> build` cyclus volledig in de cloud voor sites in de `athena-y-factory` organisatie.

### 🟧 [UX] Gebruikersvriendelijke Sheets
- [ ] Maak "Master Templates" voor Google Sheets met duidelijke instructies in het Nederlands.
- [ ] Implementeer conditionele opmaak in de Sheet (bv. cel wordt rood als tekst te lang is voor de layout).

---

## 🧠 Belangrijk om te onthouden
De kluis (`3.0-vault`) is de enige plek waar de "Holy Grail" data permanent woont. De fabriek (`3.0-factory`) is slechts de tijdelijke werkplaats waar we de verbindingen leggen.
