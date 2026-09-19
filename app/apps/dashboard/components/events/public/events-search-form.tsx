'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useZodForm } from '@/hooks/use-zod-form';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { z } from 'zod';

import { Input, useDebouncedCallback } from '@workspace/ui';

const searchSchema = z.object({
  search: z.string().optional()
});

type SearchFormData = z.infer<typeof searchSchema>;

export function EventsSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get('search') || '';

  const form = useZodForm({
    schema: searchSchema,
    defaultValues: {
      search: currentSearch
    }
  });

  const handleSearch = useDebouncedCallback((value: unknown) => {
    const s = typeof value === 'string' ? value : '';
    const params = new URLSearchParams(searchParams.toString());

    if (s.trim()) {
      params.set('search', s.trim());
    } else {
      params.delete('search');
    }

    router.push(`/events/public?${params.toString()}`);
  }, 300);

  const onSubmit = (data: SearchFormData) => {
    handleSearch(data.search || '');
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="relative flex-1 max-w-sm"
    >
      <HugeiconsIcon
        icon={Search01Icon}
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        {...form.register('search')}
        placeholder="Buscar eventos..."
        className="pl-10"
        onChange={(e) => {
          form.setValue('search', e.target.value);
          handleSearch(e.target.value);
        }}
      />
    </form>
  );
}
