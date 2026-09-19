'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen01Icon,
  Coins01Icon,
  Settings01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button, Dialog } from '@workspace/ui';

const STORAGE_KEY = 'ai-chat:onboarding-visto';

const STEPS = [
  {
    icon: BookOpen01Icon,
    title: 'As respostas vêm dos documentos',
    description:
      'Eu respondo com o que está na base de conhecimento. Quando a resposta não estiver lá, eu digo que não encontrei em vez de inventar.'
  },
  {
    icon: Coins01Icon,
    title: 'Mensagens grátis e créditos',
    description:
      'Você começa com um número de mensagens grátis. Quando elas acabam, aparece a opção de comprar créditos.'
  },
  {
    icon: Settings01Icon,
    title: 'Conta e aparência',
    description:
      'Nome, senha e tema ficam em Configurações, no menu do seu avatar.'
  }
];

export function WelcomeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) !== 'true') setOpen(true);
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog
      visible={open}
      onHide={dismiss}
      header="Como este chat funciona"
      description="Trinta segundos e você já sabe o que esperar."
      footer={
        <Button
          type="button"
          className="h-11 w-full md:h-10"
          onClick={dismiss}
        >
          Começar
        </Button>
      }
    >
      <ul className="flex flex-col gap-5">
        {STEPS.map((step) => (
          <li
            key={step.title}
            className="flex gap-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <HugeiconsIcon
                icon={step.icon}
                size={18}
                className="text-primary"
              />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                {step.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
