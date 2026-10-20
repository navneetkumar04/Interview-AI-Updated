import React from 'react';

export interface BrandIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'dark' | 'light' | 'monochrome';
  withTile?: boolean;
  className?: string;
  id?: string;
}

const sizeMap: Record<string, number> = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
};

/**
 * BrandIcon: Official Interview.ai geometric mark.
 * Features an interlocking Ascending Trajectory Bracket (growth/solutions)
 * and Foundation Dialogue Bracket (communication/interviewing) around
 * a central Precision Intelligence Nexus (AI synthesis & human alignment).
 */
export const BrandIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  variant = 'dark',
  withTile = true,
  className = '',
  id,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 32;

  // Colors based on theme variant
  const isLight = variant === 'light';
  const isMono = variant === 'monochrome';

  const tileBg = isLight ? '#F8FAFC' : '#0B0F19';
  const tileBorder = isLight ? '#E2E8F0' : '#1E293B';

  const topBracketColor = isMono
    ? 'currentColor'
    : isLight
    ? '#0284C7' // Sky-blue / Azure on light
    : '#38BDF8'; // Sky-400 on dark

  const bottomBracketColor = isMono
    ? 'currentColor'
    : isLight
    ? '#1D4ED8' // Royal blue on light
    : '#2563EB'; // Blue-600 on dark

  const nexusColor = isMono
    ? 'currentColor'
    : isLight
    ? '#0F172A' // Slate-900 on light
    : '#FFFFFF'; // Crisp white on dark

  return (
    <svg
      id={id}
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${className}`}
      aria-label="Interview.ai mark"
      role="img"
    >
      {/* Background container tile */}
      {withTile && (
        <rect
          width="32"
          height="32"
          rx="7"
          fill={tileBg}
          stroke={tileBorder}
          strokeWidth="1"
        />
      )}

      {/* Top-Right Ascending Growth Bracket (Candidate progress & interview solutions) */}
      <path
        d="M14 5.5H26.5V18H22V10H14V5.5Z"
        fill={topBracketColor}
      />

      {/* Bottom-Left Foundation Dialogue Bracket (Interview prompt & human communication) */}
      <path
        d="M18 26.5H5.5V14H10V22H18V26.5Z"
        fill={bottomBracketColor}
      />

      {/* Central Precision Intelligence Nexus (AI evaluation & matching focal point) */}
      <path
        d="M16 11.5L20.5 16L16 20.5L11.5 16Z"
        fill={nexusColor}
      />
    </svg>
  );
};

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light' | 'monochrome';
  withTile?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  iconOnly?: boolean;
  className?: string;
  onClick?: () => void;
  id?: string;
}

/**
 * BrandLogo: Primary horizontal lockup for Interview.ai.
 * Combines the geometric mark with a balanced, corporate-grade wordmark.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'dark',
  withTile = true,
  showBadge = false,
  badgeText = 'Enterprise',
  iconOnly = false,
  className = '',
  onClick,
  id,
}) => {
  const iconSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
  const textClass =
    size === 'sm'
      ? 'text-base'
      : size === 'lg'
      ? 'text-2xl sm:text-3xl'
      : 'text-lg';

  const isLight = variant === 'light';
  const wordmarkTextColor = isLight ? 'text-slate-900' : 'text-white';
  const dotAiColor = isLight ? 'text-blue-600' : 'text-blue-400';

  const content = (
    <div
      id={id}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
      onClick={onClick}
    >
      <BrandIcon
        size={iconSize}
        variant={variant}
        withTile={withTile}
        className={onClick ? 'group-hover:scale-105 transition-transform' : ''}
      />

      {!iconOnly && (
        <div className="flex items-center flex-nowrap">
          <div className="flex items-baseline font-bold tracking-tight">
            <span className={`${wordmarkTextColor} ${textClass} font-extrabold tracking-tight`}>
              Interview
            </span>
            <span className={`${dotAiColor} ${textClass} font-bold tracking-tight`}>
              .ai
            </span>
          </div>

          {showBadge && (
            <span
              className={`hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${
                isLight
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-blue-950/80 text-blue-400 border-blue-800/50'
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return content;
};
