"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
(0, test_1.test)('Rejoindre une partie Codenames', (_a) => __awaiter(void 0, [_a], void 0, function* ({ page }) {
    const roomUrl = "https://codenames.game/room/berlin-thief-scientist"; // Mets ici une URL par défaut
    yield page.goto(roomUrl);
    // 📌 1️⃣ Sélectionner le bouton de langue (ID dynamique, donc on le cible différemment)
    const languageButton = page.locator('button:has-text("language")'); // Vérifie que le texte est correct
    yield languageButton.click();
    // 📌 2️⃣ Sélectionner l'option "Français" à l'intérieur du menu déroulant
    const frenchOption = page.locator('div.flag.fr'); // Sélectionne l'option "Français" par sa classe
    yield frenchOption.click();
    // ⏳ 3️⃣ Attendre un peu pour que la page se mette à jour
    yield page.waitForTimeout(1000);
    // 📌 4️⃣ Saisir le pseudo (avec l'ID "nickname-input")
    const pseudoInput = page.locator('#nickname-input'); // Utilisation de l'ID correct
    yield pseudoInput.fill("Marie"); // Remplace "NomDuBot" par le pseudo que tu veux
    // 📌 4️⃣ Trouver et cliquer sur "Rejoindre" en français
    const joinButton = page.locator('text=Rejoindre').first();
    if (yield joinButton.isVisible()) {
        yield joinButton.click();
        console.log("✅ Langue changée en français et partie rejointe !");
    }
    else {
        console.error("❌ Impossible de trouver le bouton 'Rejoindre'.");
        return;
    }
    // ⏳ 3️⃣ Attendre un peu pour que la page se mette à jour
    yield page.waitForTimeout(1000);
    // Sélectionner "Espion"
    const spyButton = page.locator('text=Rejoindre en tant qu\'espion').first();
    if (yield spyButton.isVisible()) {
        yield spyButton.click();
        console.log("Bot a rejoint en tant qu'espion.");
    }
    else {
        console.error("Impossible de rejoindre en tant qu'espion.");
    }
    // Attendre un peu pour observer
    yield page.waitForTimeout(5000);
}));
