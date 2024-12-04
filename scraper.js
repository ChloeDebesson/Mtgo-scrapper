const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const moment = require('moment');
const archetypesStandard = require('./archetypes/standard');

const extractCards = (deck) => {
  const lines = deck.split('\n'); // Divise la liste en lignes
  const cards = [];
  let isSideboard = false; // Indique si on est dans le sideboard

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Ignore les lignes vides et les lignes de types
    if (!trimmedLine || trimmedLine.match(/^[A-Za-z\s]+\(\d+\)$/)) {
      continue;
    }

    if (trimmedLine.includes("Sideboard")) {
      isSideboard = true; // Passe en mode sideboard
      continue;
    }

    // Regex pour matcher les cartes dans le format "X Card Name"
    const match = trimmedLine.match(/^(\d+)\s+(.*)$/);

    if (match) {
      const [, number, name] = match; // Extraire les groupes regex
      cards.push({
        name: name.trim(),
        number: parseInt(number, 10),
        mainboard: !isSideboard
      });
    }
  }

  return cards;
};

(async () => {
  // Paramètres
  const format = "Standard"; // Par défaut
  const startDate = "20/11/2024"; // Exemple de date début
  const endDate = "04/12/2024"; // Exemple de date fin

  // Conversion des dates
  const start = moment(startDate, "DD/MM/YYYY");
  const end = moment(endDate, "DD/MM/YYYY");
  console.log(`Recherche des résultats de ${format} entre ${start.format(
      "DD/MM/YYYY")} et ${end.format("DD/MM/YYYY")}`);

  const browser = await puppeteer.launch();
  const browserPage = await browser.newPage();

  // Aller sur la browserPage des decklists
  await browserPage.goto('https://www.mtgo.com/decklists');
  const prefix = 'https://www.mtgo.com';
  console.log("Page des decklists chargée");

  const results = [];
  const pages = [];

  for (let i = start.month(); i <= end.month(); i++) {
    pages.push(`https://www.mtgo.com/decklists/${start.year()}/${i + 1}`);
  }

  // Scraping des informations de tournoi
  for (const currentPage of pages) {
    console.log(`Analyse de la page ${currentPage}`);

    await browserPage.goto(currentPage);

    await browserPage.waitForSelector('#decklistFilterFormat');
    await browserPage.select('#decklistFilterFormat', format); // Sélectionner le format
    console.log(`Format ${format} sélectionné`);

    let tournaments = await browserPage.evaluate(() => {
      const items = document.querySelectorAll('.decklists-item');
      return Array.from(items)
      .filter(item => window.getComputedStyle(item).display !== 'none')
      .map(item => {
        const linkElement = item.querySelector('.decklists-link');
        const dateElement = item.querySelector('.decklists-date');
        const nameElement = item.querySelector('h3');

        return {
          name: nameElement ? nameElement.textContent.trim() : null,
          date: dateElement ? dateElement.getAttribute('datetime') : null,
          link: linkElement ? linkElement.getAttribute('href') : null
        };
      });
    });

    tournaments = tournaments.filter(tournament => {
      const tournamentDate = moment(tournament.date);
      const isDateOK = tournamentDate.isBetween(start, end, 'days', '[]');
      const isTypeOK = !tournament.name.toLowerCase().includes("league");
      return isDateOK && isTypeOK;
    });

    console.log(`Nombre de tournois trouvés: ${tournaments.length}`);
    console.log("Analyse des tournois...");

    for (const tournament of tournaments) {
      const tournamentDate = moment(tournament.date);
      if (tournamentDate.isBetween(start, end, 'days', '[]')) {
        console.log(
            `Analyse du tournoi ${tournament.name} du ${tournament.date} (${tournament.link})`);
        await browserPage.goto(prefix + tournament.link);
        const data = await browserPage.evaluate(() => {
          return Array.from(document.querySelectorAll('section.decklist')).map(
              row => ({
                player: row.querySelector('.decklist-player').innerText,
                decklist: row.querySelector('.decklist-link').href,
                rawList: row.querySelector('.decklist-sort-type').innerText
              }));
        });
        for (const entry of data) {
          const decklist = extractCards(entry.rawList);
          const archetype = archetypesStandard.detectArchetype(decklist);
          results.push({
            tournamentName: tournament.name,
            player: entry.player.split(" (")[0],
            rank: entry.player.split(" (")[1].split(")")[0],
            archetype,
            tournamentDate: tournament.date,
            decklist: entry.decklist
          });
        }
      }
    }
  }

  await browser.close();

  // Écriture du CSV
  const csvWriter = createCsvWriter({
    path: `${format}_Results_${start.format("YYYYMMDD")}_${end.format(
        "YYYYMMDD")}.csv`,
    header: [
      {id: 'tournamentDate', title: 'Tournament Date'},
      {id: 'tournamentName', title: 'Tournament Name'},
      {id: 'player', title: 'Player'},
      {id: 'rank', title: 'Rank'},
      {id: 'archetype', title: 'Archetype'},
      {id: 'decklist', title: 'Decklist'}
    ]
  });

  await csvWriter.writeRecords(results);
  console.log(`Résultats sauvegardés dans ${format}_Results_${start.format(
      "YYYYMMDD")}_${end.format("YYYYMMDD")}.csv`);
})();
