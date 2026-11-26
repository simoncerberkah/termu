import { useId } from 'react';
import type { Species } from '../types/termu';

interface BrandLogoProps {
  height?: number;
  color?: string;
  className?: string;
}

export function BrandLogo({ height = 28, color = '#2B2B2B', className = '' }: BrandLogoProps) {
  const maskId = useId();
  const w = Math.round(height * (960 / 230));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 960 230"
      width={w}
      height={height}
      style={{ height: `${height}px`, width: 'auto' }}
      className={`block shrink-0 ${className}`}
      role="img"
      aria-label="TERMU"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="960" height="230" fill="#000" />
          <rect x="12" y="14" width="174" height="54" rx="16" fill="#fff" />
          <rect x="71" y="50" width="56" height="166" rx="16" fill="#fff" />
          <rect x="196" y="14" width="56" height="202" rx="16" fill="#fff" />
          <rect x="196" y="14" width="152" height="54" rx="16" fill="#fff" />
          <rect x="196" y="88" width="138" height="52" rx="16" fill="#fff" />
          <rect x="196" y="162" width="152" height="54" rx="16" fill="#fff" />
          <path d="M 358 30 Q 358 14 374 14 L 444 14 C 492 14 514 42 514 88 L 514 216 L 374 216 Q 358 216 358 200 Z" fill="#fff" />
          <path d="M 522 30 Q 522 14 538 14 L 570 14 Q 584 14 592 26 L 620 66 L 656 26 Q 666 14 680 14 L 720 14 Q 736 14 736 30 L 736 200 Q 736 216 720 216 L 510 216 L 510 88 L 522 88 Z" fill="#fff" />
          <path d="M 564 224 C 558 148 608 102 676 66 L 684 62 L 684 224 Z" fill="#000" />
          <path d="M 576 218 C 574 156 614 114 668 86 C 672 152 646 196 592 218 Z" fill="#fff" />
          <path d="M 579 222 C 588 176 616 140 651 111 C 622 146 598 180 589 222 Z" fill="#000" />
          <path d="M 496 81 C 476 81 456 72 434 50 C 430 68 441 88 461 98 C 444 97 424 103 414 114 C 426 127 444 131 461 127 C 463 148 469 169 474 185 C 472 199 473 213 480 224 L 512 224 C 519 213 520 199 518 185 C 523 169 529 148 531 127 C 548 131 566 127 578 114 C 568 103 548 97 531 98 C 551 88 562 68 558 50 C 536 72 516 81 496 81 Z" fill="#000" />
          <path d="M 750 30 Q 750 14 766 14 L 790 14 Q 806 14 806 30 L 806 118 A 43 43 0 0 0 892 118 L 892 30 Q 892 14 908 14 L 932 14 Q 948 14 948 30 L 948 118 A 99 99 0 0 1 750 118 Z" fill="#fff" />
        </mask>
      </defs>
      <rect x="0" y="0" width="960" height="230" fill={color} mask={`url(#${maskId})`} />
    </svg>
  );
}

interface AnimalIllustrationProps {
  species: Species;
  breed?: string;
  className?: string;
}

export function AnimalIllustration({ species, breed = '', className = 'w-full h-full object-cover' }: AnimalIllustrationProps) {
  const gradId = useId();
  const isCow = species === 'Sapi';
  const lowBreed = breed.toLowerCase();
  const palette = isCow
    ? lowBreed.includes('po')
      ? { bg1: '#EDEAE2', bg2: '#D9D3C5', body: '#F7F5F0', accent: '#6B655B' }
      : lowBreed.includes('simental')
        ? { bg1: '#F1E7D8', bg2: '#DCC8AC', body: '#9B5B35', accent: '#F8F4EC' }
        : { bg1: '#ECE5DC', bg2: '#D6C4B0', body: '#7C4327', accent: '#3F2316' }
    : { bg1: '#E6ECE7', bg2: '#CBD8CE', body: '#F4F1EA', accent: '#5A554C' };

  return (
    <svg viewBox="0 0 320 200" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Ilustrasi ${species} ${breed}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.bg1} />
          <stop offset="100%" stopColor={palette.bg2} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${gradId})`} />
      <circle cx="265" cy="42" r="28" fill="#F5D547" fillOpacity="0.28" />
      <ellipse cx="160" cy="176" rx="115" ry="12" fill="#2B2B2B" fillOpacity="0.09" />
      {isCow ? (
        <>
          <path
            d="M58 124 C56 96 76 80 112 80 L180 80 C208 80 226 92 232 114 L240 116 L244 102 C252 100 264 106 270 116 C272 124 265 134 252 136 L236 138 L234 176 L216 176 L212 142 L116 144 L110 176 L92 176 L92 142 C74 140 62 134 58 124 Z"
            fill={palette.body}
            stroke={palette.accent}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="250" cy="117" r="3" fill={palette.accent} />
          <path d="M236 105 C234 94 244 90 250 96" fill="none" stroke={palette.accent} strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path
            d="M90 128 C90 104 108 92 136 92 L188 92 C208 92 220 102 226 116 L238 110 C246 112 252 120 250 128 C246 134 236 136 226 134 L222 174 L208 174 L204 144 L132 144 L128 174 L114 174 L114 142 C98 140 90 135 90 128 Z"
            fill={palette.body}
            stroke={palette.accent}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="238" cy="121" r="2.6" fill={palette.accent} />
        </>
      )}
    </svg>
  );
}
