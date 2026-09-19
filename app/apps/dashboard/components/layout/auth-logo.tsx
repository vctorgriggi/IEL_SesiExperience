'use client';

import { useState } from 'react';

import { APP_NAME } from '@workspace/common/app';

const LOGO_SRC = '/logo.png';
const FALLBACK_SRC = '/favicon.png';

export function AuthLogo() {
  const [src, setSrc] = useState(LOGO_SRC);

  return (
    <img
      src={src}
      alt={APP_NAME}
      width={120}
      height={40}
      className="h-10 w-auto object-contain"
      onError={() => setSrc(FALLBACK_SRC)}
    />
  );
}
