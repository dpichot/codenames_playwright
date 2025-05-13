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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = require("openai");
const playwright_1 = require("playwright");
dotenv_1.default.config();
// Désactiver la vérification du certificat SSL (à utiliser uniquement en développement)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const room = "jack-hawk-trunk"; // Nom de la salle de jeu
// Initialiser l'API OpenAI
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// Fonction pour filtrer les cartes vides et éliminer les doublons
function cleanCards(cards) {
    return Array.from(new Set(cards.filter(card => card.trim() !== ""))); // Filtrer les vides et éliminer les doublons
}
// Fonction pour générer un indice basé sur les cartes de l'équipe en utilisant OpenAI
function generateClue(teamCards, enemyCards, neutralCards, blackCard) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("\x1b[36mDébut de la génération de l'indice...");
        const prompt = `
    Vous jouez au jeu Codenames. Vous jouez en tant qu'espion dans l'équipe rouge.
    Votre but est de générer un indice pour faire deviner les mots de votre équipe.
    Vous devez faire deviner un maximum de mots de votre équipe sans toucher aux mots de l'équipe bleue, les cartes neutres ou la carte noire.
    Surtout la carte noire.
    Il faut donc éviter les mots très génériques ou les mots qui pourraient être associés à l'équipe bleue ou la carte noire.
    Mais il faut être assez précis ou même assez subtil pour que votre équipe puisse deviner les mots.
    Voici les cartes sur le plateau:
    Cartes de l'équipe rouge restante: ${teamCards.join(', ')}
    Cartes de l'équipe bleue restante: ${enemyCards.join(', ')}
    Cartes neutres restante: ${neutralCards.join(', ')}
    Carte noire: ${blackCard}.
    J'attends un seul indice, ne proposez pas plusieurs solutions, faites comme si c'était vous qui jouiez.
    Répondez-moi seulement avec l'indice et le nombre de mots à faire deviner ainsi que les mots que vous pensez faire deviner entre parenthèses.
    Comme ceci par exemple : "MOT_INDICE NOMBRE_DE_MOTS_EN_CHIFFRE (MOT_A_FAIRE_DEVINER_1, MOT_A_FAIRE_DEVINER_2, MOT_A_FAIRE_DEVINER_3)".

    Exemples d'indices pertinents :
    - Pour les mots "COW-BOY" et "TAMBOUR", un indice pertinent pourrait être "FAR-WEST 2 (COW-BOY, TAMBOUR)".
    - Pour les mots "ROULETTE" et "CASINO", un indice pertinent pourrait être "JEUX 2 (ROULETTE, CASINO)".

    Exemples d'indices non pertinents :
    - Pour les mots "COW-BOY" et "TAMBOUR", un indice non pertinent serait "RHYTHME 2 (COW-BOY, TAMBOUR)" car "RHYTHME" n'est pas directement lié à "COW-BOY".
    - Pour les mots "ROULETTE" et "CASINO", un indice non pertinent serait "CERCLE 2 (ROULETTE, CASINO)" car "CERCLE" est trop générique.

    Générez un indice en suivant ces instructions et ces exemples.
    `;
        const response = yield openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
            n: 1,
            stop: null,
            temperature: 0.7,
        });
        if (response.choices && response.choices.length > 0 && response.choices[0].message && response.choices[0].message.content) {
            const clueResponse = response.choices[0].message.content.trim();
            console.log(`\x1b[32mRéponse de chat gpt : ${clueResponse}`);
            // Utiliser une expression régulière pour extraire l'indice, le nombre de mots et les mots eux-mêmes
            const match = clueResponse.match(/(.+?) (\d+) \(([^)]+)\)/);
            if (match) {
                const clue = match[1];
                const numberOfWords = parseInt(match[2], 10);
                const words = match[3].split(',').map(word => word.trim());
                console.log("\x1b[34mIndice généré :", clue);
                console.log("\x1b[34mMots à faire deviner :", words);
                return { clue, numberOfWords, words };
            }
            else {
                throw new Error("Invalid response format from OpenAI");
            }
        }
        else {
            throw new Error("No valid response from OpenAI");
        }
    });
}
// Fonction pour vérifier et générer un indice
function checkAndGenerateClue(page) {
    return __awaiter(this, void 0, void 0, function* () {
        // Vérifier si l'input pour l'indice est disponible
        const clueInput = page.locator('input[name="clue"]');
        if (yield clueInput.isVisible()) {
            console.log("\x1b[34mL'input pour l'indice est disponible.");
            // 📌 Récupérer les cartes de l'équipe rouge, bleue, neutres et noires
            const redCards = yield page.locator('.card.red').allTextContents(); // Cartes de l'équipe rouge
            const blueCards = yield page.locator('.card.blue').allTextContents(); // Cartes de l'équipe bleue
            const neutralCards = yield page.locator('.card.gray').allTextContents(); // Cartes neutres
            // 📌 Récupérer la carte noire (on prend le premier élément de la liste retournée)
            const blackCard = (yield page.locator('.card.black').first().allTextContents()).join("");
            console.log("\x1b[36mCartes du plateau :");
            console.log(`\x1b[36mRouge: ${cleanCards(redCards)}`);
            console.log(`\x1b[36mBleu: ${cleanCards(blueCards)}`);
            console.log(`\x1b[36mNeutre: ${cleanCards(neutralCards)}`);
            console.log(`\x1b[36mNoire: ${blackCard}`);
            console.log("\x1b[37m----------------------------------------------------------------");
            // 📌 Récupérer les cartes déjà trouvées/retournées en analysant l'historique des actions
            const foundCards = yield page.evaluate(() => {
                const historyItems = document.querySelectorAll('article.card-red em, article.card-blue em, article.card-gray em, article.card-black em');
                return Array.from(historyItems).map(item => item.textContent.trim());
            });
            console.log(`\x1b[36mCartes déjà trouvées: ${cleanCards(foundCards)}`);
            console.log("\x1b[37m----------------------------------------------------------------");
            // Filtrer les cartes trouvées des cartes restantes
            const remainingRedCards = cleanCards(redCards).filter(card => !foundCards.includes(card));
            const remainingBlueCards = cleanCards(blueCards).filter(card => !foundCards.includes(card));
            const remainingNeutralCards = cleanCards(neutralCards).filter(card => !foundCards.includes(card));
            console.log("\x1b[36mCartes restantes :");
            console.log(`\x1b[36mRouge: ${remainingRedCards}`);
            console.log(`\x1b[36mBleu: ${remainingBlueCards}`);
            console.log(`\x1b[36mNeutre: ${remainingNeutralCards}`);
            console.log("\x1b[37m----------------------------------------------------------------");
            // Générer un indice basé sur les cartes de l'équipe rouge restantes et éviter les cartes de l'équipe bleue, neutres et noires
            const { clue, numberOfWords } = yield generateClue(remainingRedCards, remainingBlueCards, remainingNeutralCards, blackCard);
            console.log("\x1b[37m----------------------------------------------------------------");
            // 📌 Donne l'indice dans l'input
            yield clueInput.fill(clue);
            console.log("\x1b[33mIndice rempli dans l'input.");
            // Sélectionner le nombre d'indices (par exemple 1)
            const numberSelectButton = page.locator('.numberSelectButton');
            yield numberSelectButton.click();
            // Sélectionner le nombre de mots à faire deviner
            const numberOption = page.locator(`.option:has-text("${numberOfWords}")`);
            yield numberOption.click();
            console.log(`\x1b[33mNombre de mots à faire deviner sélectionné : ${numberOfWords}`);
            // 📌 Cliquer sur le bouton "Donner un indice"
            const giveClueButton = page.locator('text=Donner un indice').first();
            yield giveClueButton.click();
            console.log("\x1b[32mIndice donné.");
            console.log("\x1b[37m----------------------------------------------------------------");
        }
        else {
            console.error("\x1b[37mWaiting...");
        }
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("\x1b[33mLancement du bot Codenames...");
    console.log("\x1b[37m----------------------------------------------------------------");
    // Lance le navigateur en mode non-headless (visible)
    const browser = yield playwright_1.chromium.launch({
        executablePath: "C:\\Users\\dpichot\\Documents\\Perso\\Projects\\codenames_playwright\\node_modules\\playwright-core\\.local-browsers\\chromium-1155\\chrome-win\\chrome.exe",
        headless: false,
    });
    console.log("\x1b[34mNavigateur lancé.");
    // Ouvre une nouvelle page
    const page = yield browser.newPage();
    console.log("\x1b[34mPage ouverte.");
    // Va à la page de la partie
    yield page.goto("https://codenames.game/room/" + room);
    console.log("\x1b[32mPage de la partie chargée.");
    console.log("\x1b[37m----------------------------------------------------------------");
    // 📌 Saisir le pseudo (avec l'ID "nickname-input")
    const pseudoInput = page.locator('#nickname-input');
    yield pseudoInput.fill("Marie BOT");
    console.log("\x1b[33mPseudo saisi : Marie BOT");
    // 📌 Cliquer sur "Rejoindre"
    const joinButton = page.locator('text=Rejoindre').first();
    if (yield joinButton.isVisible()) {
        yield joinButton.click();
        console.log("\x1b[32mPartie rejointe !");
    }
    else {
        console.error("Impossible de trouver le bouton 'Rejoindre'.");
        return;
    }
    console.log("\x1b[37m----------------------------------------------------------------");
    // ⏳ Attendre un peu pour que la page se mette à jour
    yield page.waitForTimeout(5000);
    // 📌 Cliquer sur "Rejoindre en tant qu'espion"
    const spyButton = page.locator('text=Rejoindre en tant qu\'espion').first();
    if (yield spyButton.isVisible()) {
        yield spyButton.click();
        console.log("\x1b[33mBot a rejoint en tant qu'espion.");
    }
    else {
        console.error("\x1b[35mImpossible de rejoindre en tant qu'espion ou déjà rejoint.");
    }
    // Attends un peu que le jeu se charge
    yield page.waitForTimeout(5000);
    // Boucle pour vérifier régulièrement si l'input pour l'indice est disponible
    while (true) {
        yield checkAndGenerateClue(page);
        yield page.waitForTimeout(15000); // Attendre 15 secondes avant de vérifier à nouveau
    }
}))();
