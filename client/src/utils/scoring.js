import PLAYERS from "../data/players.js";
import { TOTAL_ROUNDS, DRAFTERS_PER_ROUND } from "../data/constants.js";

/**
 * Calculate an adjusted score for a player based on team/region/partner overlap.
 * Penalizes concentration to encourage roster diversity.
 */
export function calcAdjustedScore(player, boardType, myPickNames, partnerPickNames) {
  const base = boardType === "chalk" ? player.chalkScore : player.varianceScore;
  let multiplier = 1;

  const myPlayers = myPickNames.map((n) => PLAYERS.find((p) => p.name === n)).filter(Boolean);
  const partnerPlayers = partnerPickNames.map((n) => PLAYERS.find((p) => p.name === n)).filter(Boolean);

  // Penalize same-team overlap on my roster
  const myTeamOverlap = myPlayers.filter((p) => p.team === player.team).length;
  if (myTeamOverlap >= 2) multiplier *= 0.12;
  else if (myTeamOverlap === 1) multiplier *= 0.5;

  // Penalize same-region concentration on my roster
  const myRegionOverlap = myPlayers.filter((p) => p.region === player.region).length;
  if (myRegionOverlap >= 4) multiplier *= 0.65;
  else if (myRegionOverlap >= 3) multiplier *= 0.82;

  // Penalize same-team overlap on partner's roster
  const partnerTeamOverlap = partnerPlayers.filter((p) => p.team === player.team).length;
  if (partnerTeamOverlap >= 2) multiplier *= 0.55;
  else if (partnerTeamOverlap === 1) multiplier *= 0.78;

  // Penalize same-region concentration on partner's roster
  const partnerRegionOverlap = partnerPlayers.filter((p) => p.region === player.region).length;
  if (partnerRegionOverlap >= 3) multiplier *= 0.88;

  return base * multiplier;
}

/**
 * Build a snake draft order for the given seat assignments.
 * Odd rounds go 1→5, even rounds go 5→1.
 */
export function buildSnakeOrder(seatMap) {
  const seatToDrafter = {};
  Object.entries(seatMap).forEach(([name, seat]) => {
    seatToDrafter[seat] = name;
  });

  const order = [];
  for (let round = 1; round <= TOTAL_ROUNDS; round++) {
    const seats =
      round % 2 === 1
        ? [1, 2, 3, 4, 5]
        : [DRAFTERS_PER_ROUND, 4, 3, 2, 1];
    seats.forEach((seat) => {
      order.push(seatToDrafter[seat]);
    });
  }
  return order;
}

/**
 * Summarize a roster: count, total EV, blind count, region breakdown.
 */
export function summarizeRoster(playerNames) {
  const players = playerNames
    .map((n) => PLAYERS.find((p) => p.name === n))
    .filter(Boolean);

  const regionCounts = {};
  players.forEach((p) => {
    regionCounts[p.region] = (regionCounts[p.region] || 0) + 1;
  });

  return {
    count: playerNames.length,
    totalEv: Math.round(players.reduce((sum, p) => sum + p.ev, 0)),
    blindCount: players.filter((p) => !KNOWN_TO_OPPONENTS.has(p.name)).length,
    regionCounts,
  };
}

// Re-export for convenience
import { KNOWN_TO_OPPONENTS } from "../data/constants.js";
