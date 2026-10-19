import { useState, useEffect } from 'react';
import { cropGrowtopiaHead } from '../../../utils/growtopiaCropper';

/**
 * Resolves the best available avatar URL for a character, NPC, or player.
 * Priority:
 *  1. entity.aiMeta.image.dataUrl (Growtopia AI rendered composite PNG)
 *  2. entity.image.dataUrl
 *  3. entity.avatarUrl (if Growtopia dataUrl or custom URL)
 *  4. entity.imageUrl
 *  5. Deterministic fallback
 */
export function getAvatarUrl(entity, fallbackSeed) {
  if (!entity && !fallbackSeed) return '';

  if (typeof entity === 'string') {
    if (entity.startsWith('http://') || entity.startsWith('https://') || entity.startsWith('data:')) {
      return entity;
    }
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(entity)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }

  // 1. Direct Growtopia rendered image from aiMeta or image object
  if (entity?.aiMeta?.image?.dataUrl) {
    return entity.aiMeta.image.dataUrl;
  }
  if (entity?.image?.dataUrl) {
    return entity.image.dataUrl;
  }

  // 2. Direct avatarUrl (if present and not a generic dicebear link)
  if (entity?.avatarUrl && !entity.avatarUrl.includes('dicebear')) {
    return entity.avatarUrl;
  }
  if (entity?.imageUrl) return entity.imageUrl;
  if (typeof entity?.avatar === 'string' && (entity.avatar.startsWith('http') || entity.avatar.startsWith('data:'))) {
    return entity.avatar;
  }
  if (entity?.avatarUrl) return entity.avatarUrl;

  const seed = entity?.name || fallbackSeed || 'Adventurer';
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * Reusable Avatar component for Characters, NPCs, and Fellowship members.
 * Supports automated Growtopia head-cropping for pixel-art portraits.
 */
export default function GrimoireAvatar({
  entity,
  name,
  avatarUrl,
  size = 'md',
  shape = 'circle',
  border = true,
  className = '',
  statusDot = null,
  onClick = null,
}) {
  const [hasError, setHasError] = useState(false);
  const [croppedUrl, setCroppedUrl] = useState(null);

  const resolvedName = name || entity?.name || 'Hero';
  const resolvedUrl = avatarUrl || getAvatarUrl(entity, resolvedName);
  const initials = resolvedName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'H';

  // Automatically crop Growtopia sprites to just the head/face/hat region
  useEffect(() => {
    let active = true;
    if (resolvedUrl && resolvedUrl.startsWith('data:image/png')) {
      cropGrowtopiaHead(resolvedUrl).then((cropped) => {
        if (active) setCroppedUrl(cropped);
      });
    } else {
      setCroppedUrl(null);
    }
    return () => {
      active = false;
    };
  }, [resolvedUrl]);

  const displaySrc = croppedUrl || resolvedUrl;
  const isPixel = displaySrc && (displaySrc.startsWith('data:image/') || displaySrc.includes('growtopia'));

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-32 h-32 text-4xl',
  }[size] || 'w-12 h-12 text-sm';

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const borderClass = border ? 'border-2 border-grimoire-gold/80 shadow-sm' : '';

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 flex items-center justify-center select-none bg-grimoire-dark text-parchment font-serif font-bold overflow-hidden ${roundedClass} ${sizeClasses} ${borderClass} ${className} ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
      title={resolvedName}
    >
      {!hasError && displaySrc ? (
        <img
          src={displaySrc}
          alt={resolvedName}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover ${roundedClass}`}
          style={isPixel ? { imageRendering: 'pixelated' } : undefined}
          loading="lazy"
        />
      ) : (
        <span className="leading-none">{initials}</span>
      )}

      {/* Optional Vitality / Online Status Dot */}
      {statusDot && (
        <div
          className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
            statusDot === 'online' || statusDot === 'alive' || statusDot === true
              ? 'bg-emerald-500'
              : statusDot === 'danger' || statusDot === 'dead'
              ? 'bg-red-500'
              : 'bg-amber-500'
          }`}
        />
      )}
    </div>
  );
}
