import lockupBlueCard from '../tokens/assets/brand/identity/lockup-blue-card.png';
import lockupBlueOnWhite from '../tokens/assets/brand/identity/lockup-blue-on-white.png';
import lockupCardOnBlue from '../tokens/assets/brand/identity/lockup-card-on-blue.png';
import lockupWhiteOnBlue from '../tokens/assets/brand/identity/lockup-white-on-blue.png';
import markBlackOnBlue from '../tokens/assets/brand/identity/mark-black-on-blue.png';
import markBlackTransparent from '../tokens/assets/brand/identity/mark-black-transparent.png';
import markBlueOnWhite from '../tokens/assets/brand/identity/mark-blue-on-white.png';
import markBlueTransparent from '../tokens/assets/brand/identity/mark-blue-transparent.png';
import markGrayOnCharcoal from '../tokens/assets/brand/identity/mark-gray-on-charcoal.png';
import markPeachOnCream from '../tokens/assets/brand/identity/mark-peach-on-cream.png';
import markPinkOnBlush from '../tokens/assets/brand/identity/mark-pink-on-blush.png';
import markWhiteOnBlack from '../tokens/assets/brand/identity/mark-white-on-black.png';
import markWhiteOnBlue from '../tokens/assets/brand/identity/mark-white-on-blue.png';
import markWhiteTransparent from '../tokens/assets/brand/identity/mark-white-transparent.png';
import wordmarkBlue from '../tokens/assets/brand/identity/wordmark-blue.png';
import wordmarkWhite from '../tokens/assets/brand/identity/wordmark-white.png';

export type ReclaimLogo = {
  id: string;
  label: string;
  src: string;
};

/** Approved Reclaim identity variants packaged for product and media use. */
export const reclaimLogos: readonly ReclaimLogo[] = [
  {id: 'blue-transparent', label: 'Blue mark', src: markBlueTransparent},
  {id: 'white-transparent', label: 'White mark', src: markWhiteTransparent},
  {id: 'black-transparent', label: 'Black mark', src: markBlackTransparent},
  {id: 'black-on-blue', label: 'Black on blue', src: markBlackOnBlue},
  {id: 'blue-wordmark', label: 'Blue wordmark', src: wordmarkBlue},
  {id: 'white-wordmark', label: 'White wordmark', src: wordmarkWhite},
  {id: 'white-on-blue', label: 'White on blue', src: markWhiteOnBlue},
  {id: 'blue-on-white', label: 'Blue on white', src: markBlueOnWhite},
  {id: 'pink-on-blush', label: 'Pink on blush', src: markPinkOnBlush},
  {id: 'white-on-black', label: 'White on black', src: markWhiteOnBlack},
  {id: 'gray-on-charcoal', label: 'Gray on charcoal', src: markGrayOnCharcoal},
  {id: 'peach-on-cream', label: 'Peach on cream', src: markPeachOnCream},
  {id: 'lockup-blue-on-white', label: 'Blue lockup', src: lockupBlueOnWhite},
  {id: 'lockup-white-on-blue', label: 'White lockup', src: lockupWhiteOnBlue},
  {
    id: 'lockup-card-on-blue',
    label: 'Paper card on blue',
    src: lockupCardOnBlue,
  },
  {id: 'lockup-blue-card', label: 'Blue card on paper', src: lockupBlueCard},
] as const;
