// Fonction pour détecter l'archétype
const detectArchetype = (decklist) => {
  // Filtrer uniquement les cartes du mainboard
  const mainboardCards = decklist.filter(card => card.mainboard);

  // Fonction utilitaire pour compter les occurrences d'une carte
  const countCard = (cardName) => {
    const card = mainboardCards.find(c => c.name.toLowerCase() === cardName.toLowerCase());
    return card ? card.number : 0;
  };

  // Détection des archétypes
  if (countCard("Unholy Annex && Ritual Chamber") >= 3 && countCard("Blooming Marsh") === 0) {
    return "Bx Annex";
  }

  if (countCard('Blooming Marsh') === 4 && countCard('Glissa Sunslayer') >= 1) {
    return "Golgari Midrange";
  }

  if (countCard('Slickshot Showoff') >= 3 || countCard('Emberheart Challenger') >= 3) {
    return "Red Aggro";
  }

  if (countCard('Kaito, Bane of Nightmares') >= 1) {
    return "Dimir Midrange";
  }

  if (countCard('Carrot Cake') >= 3) {
    return "Mono Blanc Tokens";
  }

  if (countCard('Abhorrent Oculus') >= 3 && countCard('Helping Hand') >= 2) {
    return "UW Eye";
  }

  if (countCard('Valley Floodcaller') >= 3 && countCard('Enduring Vitality') >= 3) {
    return "Temur Floodcaller";
  }

  if (countCard('Zur, Eternal Schemer') >= 3 && countCard('Overlord of the Mistmoors') >= 3) {
    return "Zur Overlords";
  }

  if (countCard('Zombify') >= 3 && countCard('Atraxa, Grand Unifier') >= 3) {
    return "Reanimator";
  }

  if (countCard('Novice Inspector') >= 4 && countCard('Knight-Errant of Eos') >= 3) {
    return "Convoke";
  }

  return "Others";
};

exports.detectArchetype = detectArchetype;