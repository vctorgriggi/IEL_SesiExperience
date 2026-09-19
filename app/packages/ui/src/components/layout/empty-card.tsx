import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from './card';

export type EmptyCardProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
};

export function EmptyCard({
  icon,
  title,
  description,
  children
}: EmptyCardProps) {
  return (
    <div className="flex min-h-[56vh] items-center justify-center px-4 py-12">
      <Card
        variant="outlined"
        padding="lg"
        className="card-lg w-full max-w-md"
      >
        <CardHeader className="flex flex-col items-center gap-5 text-center">
          <div className="avatar avatar-placeholder flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {icon}
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="max-w-xs text-center leading-6">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        {children ? (
          <CardContent className="card-actions flex justify-center pt-2">
            {children}
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
