import React from 'react';
import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center justify-center">
      {/* Logo platefull - usando imagem platefull_logo_white_transparent_v2 */}
      <Image
        src="/platefull_logo_white_transparent_v2.png"
        alt="platefull"
        width={180}
        height={50}
        className="h-auto w-auto max-w-[180px] sm:max-w-[200px] md:max-w-[220px]"
        priority
        style={{
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
