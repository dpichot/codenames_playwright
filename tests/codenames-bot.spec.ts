import { test } from '@playwright/test';

test('Rejoindre une partie Codenames', async ({ page }) => {
    const roomUrl = "https://codenames.game/room/berlin-thief-scientist"; // Mets ici une URL par défaut

    await page.goto(roomUrl);

    // 📌 1️⃣ Sélectionner le bouton de langue (ID dynamique, donc on le cible différemment)
    const languageButton = page.locator('button:has-text("language")'); // Vérifie que le texte est correct
    await languageButton.click();

    // 📌 2️⃣ Sélectionner l'option "Français" à l'intérieur du menu déroulant
    const frenchOption = page.locator('div.flag.fr'); // Sélectionne l'option "Français" par sa classe
    await frenchOption.click();

    // ⏳ 3️⃣ Attendre un peu pour que la page se mette à jour
    await page.waitForTimeout(1000);

    // 📌 4️⃣ Saisir le pseudo (avec l'ID "nickname-input")
    const pseudoInput = page.locator('#nickname-input'); // Utilisation de l'ID correct
    await pseudoInput.fill("Marie"); // Remplace "NomDuBot" par le pseudo que tu veux

    // 📌 4️⃣ Trouver et cliquer sur "Rejoindre" en français
    const joinButton = page.locator('text=Rejoindre').first();
    if (await joinButton.isVisible()) {
        await joinButton.click();
        console.log("✅ Langue changée en français et partie rejointe !");
    } else {
        console.error("❌ Impossible de trouver le bouton 'Rejoindre'.");
        return;
    }

    // ⏳ 3️⃣ Attendre un peu pour que la page se mette à jour
    await page.waitForTimeout(1000);

    // Sélectionner "Espion"
    const spyButton = page.locator('text=Rejoindre en tant qu\'espion').first();
    if (await spyButton.isVisible()) {
        await spyButton.click();
        console.log("Bot a rejoint en tant qu'espion.");
    } else {
        console.error("Impossible de rejoindre en tant qu'espion.");
    }

    // Attendre un peu pour observer
    await page.waitForTimeout(5000);
});