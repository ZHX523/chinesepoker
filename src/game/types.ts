export type Suit = 'diamonds' | 'clubs' | 'hearts' | 'spades';

export type Rank =
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A'
  | '2';

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
}

export type CombinationType =
  | 'single'
  | 'pair'
  | 'triple'
  | 'straight'
  | 'flush'
  | 'fullhouse'
  | 'fourofakind'
  | 'straightflush';

export interface Combination {
  type: CombinationType;
  cards: Card[];
  /** Primary strength for comparing within the same combination type */
  strength: number;
  /** Highest card used for tie-breaking (card + suit order) */
  highCard: Card;
}

export interface PileState {
  combination: Combination;
  playedByIndex: number;
}

export type GamePhase = 'DEALING' | 'PLAYING' | 'GAMEOVER';

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  hand: Card[];
}

export interface ScoreEntry {
  playerId: number;
  name: string;
  cardsLeft: number;
  penalty: number;
}

export interface ActionLogEntry {
  id: string;
  text: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface GameState {
  players: Player[];
  activePlayerIndex: number;
  consecutivePasses: number;
  gamePhase: GamePhase;
  /** Last combination played — stays visible on the table for the whole hand */
  pile: PileState | null;
  /** True only for the first play of the entire match */
  isOpeningTurn: boolean;
  /**
   * After three passes: who may lead next (pile stays visible for reference).
   * Cleared as soon as that player plays.
   */
  freeLeadPlayerIndex: number | null;
  lastTrickWinnerIndex: number | null;
  winnerId: number | null;
  scores: ScoreEntry[] | null;
  errorMessage: string | null;
  actionLog: ActionLogEntry[];
}
