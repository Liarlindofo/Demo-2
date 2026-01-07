import React from 'react';
import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center justify-center">
      {/* Logo platefull - usando imagem platefull_logo_white_transparent_v2 */}
      <Image
        src="/platefull_logo_white_transparent_v2.png"
        alt="platefull"
        width={120}
        height={35}
        className="h-auto w-auto max-w-[120px] sm:max-w-[140px] md:max-w-[160px]"
        priority
        style={{
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
