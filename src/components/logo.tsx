import React from 'react';

export function Logo() {
  return (
    <div className="flex items-center justify-center">
      {/* Logo platefull com estilo script/handwritten - exatamente como na imagem */}
      <div className="text-white relative inline-block" style={{
        fontFamily: '"Brush Script MT", "Lucida Handwriting", "Segoe Script", cursive',
        fontSize: '2.25rem',
        fontWeight: '400',
        fontStyle: 'normal',
        letterSpacing: '0.01em',
        lineHeight: '1.1',
        whiteSpace: 'nowrap'
      }}>
        <span className="relative inline-block" style={{ 
          transform: 'rotate(-1deg)',
          display: 'inline-block'
        }}>
          p
        </span>
        <span className="relative inline-block">
          late
        </span>
        <span className="relative inline-block" style={{ 
          position: 'relative',
          display: 'inline-block'
        }}>
          <span style={{ 
            display: 'inline-block',
            position: 'relative',
            zIndex: 2
          }}>
            f
          </span>
          {/* Linha longa do 'f' que se estende horizontalmente para sublinhar "atefull" */}
          <span 
            className="absolute bg-white"
            style={{
              height: '1.5px',
              bottom: '8px',
              left: '-20px',
              right: '-20px',
              zIndex: 1
            }}
          />
        </span>
        <span className="relative inline-block" style={{ 
          position: 'relative', 
          zIndex: 2,
          display: 'inline-block'
        }}>
          ull
        </span>
      </div>
    </div>
  );
}
