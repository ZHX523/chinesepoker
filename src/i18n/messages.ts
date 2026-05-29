import type { DisplayLanguage } from '../settings/gameSettings';
import type { TranslateParams } from './types';

const en = {
  common: {
    player: 'Player',
    winner: 'Winner',
    anotherPlayer: 'another player',
    send: 'Send',
    save: 'Save',
    copy: 'Copy',
    copied: 'Copied!',
    remove: 'Remove',
    host: 'Host',
    computer: 'Computer',
    waiting: 'Waiting…',
    cards: '{count} cards',
    card: '{count} card',
    secondsRemaining: '{count} seconds remaining',
    cardAria: '{rank} of {suit}',
    close: 'Close',
  },
  suits: {
    diamonds: 'diamonds',
    clubs: 'clubs',
    hearts: 'hearts',
    spades: 'spades',
  },
  bots: {
    north: 'Bot North',
    east: 'Bot East',
    west: 'Bot West',
  },
  title: {
    chinesePoker: 'Chinese Poker',
    chodaiD: '鋤大D',
  },
  join: {
    enterName: 'Enter a name to join the table.',
    title: 'Join the table',
    subtitleInvite:
      'Table {roomId} · choose your display name. If the game has started or all seats are taken, you\'ll watch as a spectator.',
    subtitleDefault: 'Choose a display name, then pick how you want to play.',
    yourName: 'Name',
    joinTable: 'Join table',
    modePrompt: 'Play with Computer or with Friends?',
    computer: 'Computer',
    friends: 'Friends',
  },
  share: {
    title: 'Share this link with friends to play!',
    subtitle: 'Up to 4 players per table.',
    shareLink: 'Share link',
    tableSeats: 'Table seats ({filled}/{max})',
    emptySeat: 'Empty seat',
    addComputer: '+ Computer',
    startGame: 'Deal Cards & Start!',
    waitingHost: 'Waiting for the host to start the game…',
    removeFromSeat: 'Remove {name} from {label}',
    seatFallback: 'Seat {n}',
  },
  seats: {
    bottom: 'Bottom',
    top: 'Top',
    right: 'Right',
    left: 'Left',
  },
  gameOver: {
    title: 'Game Over',
    winnerSubtitle: '{name} emptied their hand first.',
    player: 'Player',
    cards: 'Cards',
    penalty: 'Penalty',
    playAgain: 'Play Again',
  },
  menu: {
    open: 'Open menu',
    confirmRestart: 'Confirm restart',
    confirmLobby: 'Confirm leave lobby',
    settings: 'Settings',
    gameMenu: 'Game menu',
    restartTitle: 'Restart this game?',
    restartBody:
      'This restarts the current table and deals a new hand. It does not leave the lobby.',
    restart: 'Restart',
    restartGame: 'Restart Game',
    lobbyTitle: 'Leave this table?',
    lobbyBody: 'You will return to the home screen and can choose how to play again.',
    lobby: 'Lobby',
    backToMenu: '← Menu',
    turnAlert: 'Turn alert',
    unmuteTurnAlert: 'Unmute turn alert',
    muteTurnAlert: 'Mute turn alert',
    turnTimer: 'Turn timer (seconds)',
    turnTimerHint: 'Default {default}s · {min}–{max}s',
  },
  chat: {
    region: 'Game chat',
    title: 'Table Chat',
    muted: 'Muted',
    unmute: 'Unmute table chat',
    mute: 'Mute table chat',
    show: 'Show table chat',
    hide: 'Hide table chat',
    mutedTitle: 'Table chat muted',
    mutedHint: 'Tap the eye icon to show messages again',
    empty: 'Game log and chat appear here…',
    placeholder: 'Message…',
  },
  pass: {
    label: 'PASS',
    aria: 'Pass',
    titleEnabled: 'Pass your turn',
    titleDisabled: 'Pass is only available on your turn when you may pass',
  },
  table: {
    yourHand: 'Your Hand',
    freeLeadHint: 'Free lead — play any valid combo from hand or hold slots.',
    dealing: 'Dealing cards…',
    thinking: '{name} is thinking…',
    spectating:
      'Spectating — you can watch the table and chat. Player hands are hidden.',
    playSelected: 'Play ({count})',
    playSelectedHint: 'Select cards to play',
  },
  pile: {
    freeLead: 'Free lead',
    openingLead: 'Opening lead',
    centerTrick: 'Center trick',
    mayLeadNext: '{name} may lead next',
    beatOrPass: 'Beat this play or pass',
    include3D: 'Include 3♦ in your play',
    playToLead: 'Play to lead',
    dropHint: '· drop anywhere on the table',
    lastPlayedBy: 'Last Played',
    lastPlayedByAria: 'Last played by {name}',
    dropOpening: 'Drop your opening play on the table',
    dropToPlay: 'Drop cards on the table to play',
  },
  profile: {
    currentTurn: 'Current turn',
    disconnected: 'Disconnected',
    pickIcon: 'Choose your Chinese zodiac',
    changeIcon: 'Change profile icon',
    cardsLabel: 'CARDS',
  },
  zodiac: {
    '0': 'Rat',
    '1': 'Ox',
    '2': 'Tiger',
    '3': 'Rabbit',
    '4': 'Dragon',
    '5': 'Snake',
    '6': 'Horse',
    '7': 'Goat',
    '8': 'Monkey',
    '9': 'Rooster',
    '10': 'Dog',
    '11': 'Pig',
  },
  reserve: {
    comboA: 'HOLD COMBO A',
    comboB: 'HOLD COMBO B',
    comboFallback: 'Hold Combo {n}',
    emptyHint: 'RESERVE YOUR COMBO',
    bomb: 'Bomb · {base}',
    bombSetup: 'Bomb setup · 4 of a Kind',
    fourCards: '4 cards',
    twoCards: '2 cards',
    threeCards: '3 cards',
    cardCount: '{count} card',
    cardsCount: '{count} cards',
    hintStashBomb: 'Stash all 5 for a bomb',
    hintFullHouse: 'Add kicker for full house',
    hintNotPlayable: 'Not playable as-is',
    hintNeedsPair: 'Needs a pair',
    hintNeedsTriple: 'Needs a triple',
    hintNotLegal: 'Not a legal play',
  },
  combo: {
    single: 'Single',
    pair: 'Pair',
    triple: 'Triple',
    straight: 'Straight',
    flush: 'Flush',
    fullhouse: 'Full House',
    fourofakind: 'Four of a Kind',
    straightflush: 'Straight Flush',
  },
  log: {
    deal: 'New hand — {name} opens (must play 3♦).',
    play: '{name} played {combo} ({cards})',
    pass: '{name} passed.',
    trickWon: 'Everyone passed — {name} may lead any valid hand.',
    win: '{name} emptied their hand and wins!',
  },
  errors: {
    handNotStarted: 'The hand has not started yet.',
    wrongTurn: "It's {name}'s turn.",
    selectCard: 'Select at least one card.',
    cardsNotInHand:
      'Those cards are not in your hand. Use Play combo on a reserve slot if they are stashed there.',
    invalidCombo:
      'Not a valid combination. Use a single, pair, triple, or five-card hand.',
    openingNeed3D: 'Opening play must include the 3♦.',
    openingPlayInvalid:
      'Opening play must include the 3♦ and be a valid combination.',
    freeLeadPlay:
      'Play any valid combination — single, pair, triple, or five-card hand.',
    invalidBeat: 'Invalid play — match the pile type and beat it.',
    mustPlayOpening: 'You must play on the opening turn (include 3♦).',
    freeLeadMustPlay:
      'You won the trick — play any valid combination (no need to beat the cards shown).',
  },
  room: {
    invalidLink:
      'This table link is invalid or has expired. Ask the host to copy the link again.',
    invalidLinkShort: 'This table link is invalid or has expired.',
    notExists: 'This table no longer exists.',
    hostOnlyAddComputer: 'Only the host can add a computer.',
    hostOnlyRemoveComputer: 'Only the host can remove a computer.',
    gameStarted: 'The game has already started.',
    invalidSeat: 'Invalid seat.',
    seatTaken: 'That seat is already taken.',
    computerOnlyRemove: 'Only computer players can be removed.',
  },
} as const;

const zh = {
  common: {
    player: '玩家',
    winner: '赢家',
    anotherPlayer: '其他玩家',
    send: '发送',
    save: '保存',
    copy: '复制',
    copied: '已复制！',
    remove: '移除',
    host: '房主',
    computer: '电脑',
    waiting: '等待中…',
    cards: '{count} 张牌',
    card: '{count} 张牌',
    secondsRemaining: '剩余 {count} 秒',
    cardAria: '{rank} {suit}',
    close: '关闭',
  },
  suits: {
    diamonds: '方块',
    clubs: '梅花',
    hearts: '红心',
    spades: '黑桃',
  },
  bots: {
    north: '电脑北',
    east: '电脑东',
    west: '电脑西',
  },
  title: {
    chinesePoker: 'Chinese Poker',
    chodaiD: '鋤大D',
  },
  join: {
    enterName: '请输入昵称以加入牌桌。',
    title: '加入牌桌',
    subtitleInvite:
      '牌桌 {roomId} · 请输入昵称。若牌局已开始或座位已满，你将以观众身份观看。',
    subtitleDefault: '请输入昵称，然后选择游戏方式。',
    yourName: '名称',
    joinTable: '加入牌桌',
    modePrompt: '与电脑对战还是与好友对战？',
    computer: '电脑',
    friends: '好友',
  },
  share: {
    title: '分享链接邀请好友一起玩！',
    subtitle: '每桌最多 4 名玩家。',
    shareLink: '分享链接',
    tableSeats: '座位 ({filled}/{max})',
    emptySeat: '空座位',
    addComputer: '+ 电脑',
    startGame: '发牌并开始！',
    waitingHost: '等待房主开始游戏…',
    removeFromSeat: '将 {name} 从{label}移除',
    seatFallback: '座位 {n}',
  },
  seats: {
    bottom: '下方',
    top: '上方',
    right: '右方',
    left: '左方',
  },
  gameOver: {
    title: '游戏结束',
    winnerSubtitle: '{name} 最先出完手牌。',
    player: '玩家',
    cards: '剩余牌',
    penalty: '罚分',
    playAgain: '再玩一局',
  },
  menu: {
    open: '打开菜单',
    confirmRestart: '确认重新开始',
    confirmLobby: '确认离开牌桌',
    settings: '设置',
    gameMenu: '游戏菜单',
    restartTitle: '重新开始本局？',
    restartBody: '将重新发牌开始新一局，不会离开当前牌桌。',
    restart: '重新开始',
    restartGame: '重新开始',
    lobbyTitle: '离开此牌桌？',
    lobbyBody: '将返回首页，可重新选择游戏方式。',
    lobby: '大厅',
    backToMenu: '← 菜单',
    turnAlert: '回合提示音',
    unmuteTurnAlert: '开启回合提示音',
    muteTurnAlert: '关闭回合提示音',
    turnTimer: '回合计时（秒）',
    turnTimerHint: '默认 {default} 秒 · {min}–{max} 秒',
  },
  chat: {
    region: '游戏聊天',
    title: '牌桌聊天',
    muted: '已静音',
    unmute: '取消聊天静音',
    mute: '聊天静音',
    show: '显示牌桌聊天',
    hide: '隐藏牌桌聊天',
    mutedTitle: '牌桌聊天已静音',
    mutedHint: '点击眼睛图标再次显示消息',
    empty: '游戏记录和聊天将显示在这里…',
    placeholder: '输入消息…',
  },
  pass: {
    label: '不要',
    aria: '不要',
    titleEnabled: '跳过本回合',
    titleDisabled: '仅在你可不要时可用',
  },
  table: {
    yourHand: '你的手牌',
    freeLeadHint: '自由领出 — 可从手牌或保留组合中出牌。',
    dealing: '发牌中…',
    thinking: '{name} 思考中…',
    spectating: '观战中 — 可观看牌桌并聊天，玩家手牌已隐藏。',
    playSelected: '出牌 ({count})',
    playSelectedHint: '选择要出的牌',
  },
  pile: {
    freeLead: '自由领出',
    openingLead: '首出',
    centerTrick: '台面',
    mayLeadNext: '{name} 可领出下一手',
    beatOrPass: '压牌或不要',
    include3D: '首出须包含 3♦',
    playToLead: '领出出牌',
    dropHint: '· 拖放到牌桌任意位置',
    lastPlayedBy: '最后出牌',
    lastPlayedByAria: '最后出牌：{name}',
    dropOpening: '将首出牌拖放到牌桌',
    dropToPlay: '拖放卡牌到牌桌出牌',
  },
  profile: {
    currentTurn: '当前回合',
    disconnected: '已断开',
    pickIcon: '选择你的生肖',
    changeIcon: '更换头像',
    cardsLabel: '张牌',
  },
  zodiac: {
    '0': '鼠',
    '1': '牛',
    '2': '虎',
    '3': '兔',
    '4': '龙',
    '5': '蛇',
    '6': '马',
    '7': '羊',
    '8': '猴',
    '9': '鸡',
    '10': '狗',
    '11': '猪',
  },
  reserve: {
    comboA: '保留组合 A',
    comboB: '保留组合 B',
    comboFallback: '保留组合 {n}',
    emptyHint: '保留你的组合',
    bomb: '炸弹 · {base}',
    bombSetup: '炸弹预备 · 四条',
    fourCards: '4 张',
    twoCards: '2 张',
    threeCards: '3 张',
    cardCount: '{count} 张',
    cardsCount: '{count} 张',
    hintStashBomb: '存满 5 张组成炸弹',
    hintFullHouse: '加一张成葫芦',
    hintNotPlayable: '暂不可出',
    hintNeedsPair: '需要一对',
    hintNeedsTriple: '需要三条',
    hintNotLegal: '非法组合',
  },
  combo: {
    single: '单张',
    pair: '对子',
    triple: '三条',
    straight: '顺子',
    flush: '同花',
    fullhouse: '葫芦',
    fourofakind: '四条',
    straightflush: '同花顺',
  },
  log: {
    deal: '新一局 — {name} 首出（须出 3♦）。',
    play: '{name} 出了 {combo}（{cards}）',
    pass: '{name} 不要。',
    trickWon: '全员不要 — {name} 可自由领出。',
    win: '{name} 出完手牌，获胜！',
  },
  errors: {
    handNotStarted: '牌局尚未开始。',
    wrongTurn: '轮到 {name} 出牌。',
    selectCard: '请至少选择一张牌。',
    cardsNotInHand: '这些牌不在你的手牌中。若在保留区，请从保留区出牌。',
    invalidCombo: '非法组合。请出单张、对子、三条或五张牌型。',
    openingNeed3D: '首出须包含 3♦。',
    openingPlayInvalid: '首出须包含 3♦ 且为合法组合。',
    freeLeadPlay: '请出任意合法组合 — 单张、对子、三条或五张牌型。',
    invalidBeat: '出牌无效 — 须同类型且更大。',
    mustPlayOpening: '首回合必须出牌（须含 3♦）。',
    freeLeadMustPlay: '你赢了上一墩 — 请出任意合法组合（无需压牌）。',
  },
  room: {
    invalidLink: '此牌桌链接无效或已过期，请让房主重新复制链接。',
    invalidLinkShort: '此牌桌链接无效或已过期。',
    notExists: '此牌桌已不存在。',
    hostOnlyAddComputer: '仅房主可添加电脑。',
    hostOnlyRemoveComputer: '仅房主可移除电脑。',
    gameStarted: '游戏已开始。',
    invalidSeat: '无效座位。',
    seatTaken: '该座位已被占用。',
    computerOnlyRemove: '只能移除电脑玩家。',
  },
};

export const messages: Record<DisplayLanguage, Record<string, unknown>> = { en, zh };

function getNested(obj: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export function translate(
  language: DisplayLanguage,
  key: string,
  params?: TranslateParams,
): string {
  const template =
    getNested(messages[language] as unknown as Record<string, unknown>, key) ??
    getNested(messages.en as unknown as Record<string, unknown>, key) ??
    key;

  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    return value == null ? `{${name}}` : String(value);
  });
}

export function comboLabel(
  language: DisplayLanguage,
  type: string,
): string {
  return translate(language, `combo.${type}`);
}

const BOT_NAME_TO_KEY: Record<string, string> = {
  'Bot North': 'bots.north',
  'Bot East': 'bots.east',
  'Bot West': 'bots.west',
};

export function displayPlayerName(
  language: DisplayLanguage,
  name: string,
): string {
  if (!name.trim()) return translate(language, 'common.player');
  const botKey = BOT_NAME_TO_KEY[name];
  if (botKey) return translate(language, botKey);
  if (name === 'Player') return translate(language, 'common.player');
  return name;
}

export function translateI18n(
  language: DisplayLanguage,
  message: { key: string; params?: TranslateParams },
): string {
  const params = { ...message.params };
  if (params.comboType && typeof params.comboType === 'string') {
    params.combo = comboLabel(language, params.comboType);
    delete params.comboType;
  }
  if (params.name === '__another__') {
    params.name = translate(language, 'common.anotherPlayer');
  } else if (typeof params.name === 'string') {
    params.name = displayPlayerName(language, params.name);
  }
  return translate(language, message.key, params);
}
