import Image from 'next/image';

import { APP_NAME } from '@workspace/common/app';

interface LogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({ size = 32, className, priority }: LogoProps) {
  const n = typeof size === 'number' ? size : 32;
  return (
    <Image
      src="/logo.png"
      alt={APP_NAME}
      width={n}
      height={n}
      className={className}
      priority={priority}
    />
  );
}
