'use client';

import { useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { totpDisable, totpEnable, totpSetup } from '@/features/account/actions';
import { firstValidationError, getErrorMessage } from '@/lib/get-error-message';
import { useAction } from 'next-safe-action/hooks';
import QRCode from 'qrcode';

export type MfaStep = 'idle' | 'setup' | 'verify' | 'recovery' | 'disable';

export type MfaState = {
  step: MfaStep;
  isEnabled: boolean;
  setupData: { secret: string; otpauthUrl: string } | null;
  qrDataUrl: string | null;
  recoveryCodes: string[] | null;
  error: string | null;
};

type MfaAction =
  | { type: 'START_SETUP'; payload: { secret: string; otpauthUrl: string } }
  | { type: 'SET_QR'; payload: string | null }
  | { type: 'ENABLE_SUCCESS'; payload: string[] }
  | { type: 'ENABLE_ERROR'; payload: string }
  | { type: 'DISABLE_SUCCESS' }
  | { type: 'DISABLE_ERROR'; payload: string }
  | { type: 'RECOVERY_DONE' }
  | { type: 'RESET_SETUP' }
  | { type: 'SET_ERROR'; payload: string | null };

function mfaReducer(
  state: Omit<MfaState, 'isEnabled'>,
  action: MfaAction
): Omit<MfaState, 'isEnabled'> {
  switch (action.type) {
    case 'START_SETUP':
      return {
        ...state,
        step: 'setup',
        setupData: action.payload,
        error: null
      };
    case 'SET_QR':
      return { ...state, qrDataUrl: action.payload };
    case 'ENABLE_SUCCESS':
      return {
        ...state,
        step: 'recovery',
        recoveryCodes: action.payload,
        error: null
      };
    case 'ENABLE_ERROR':
      return { ...state, error: action.payload };
    case 'DISABLE_SUCCESS':
      return {
        ...state,
        step: 'idle',
        error: null
      };
    case 'DISABLE_ERROR':
      return { ...state, error: action.payload };
    case 'RECOVERY_DONE':
      return {
        ...state,
        step: 'idle',
        recoveryCodes: null,
        setupData: null,
        qrDataUrl: null
      };
    case 'RESET_SETUP':
      return {
        ...state,
        step: 'idle',
        setupData: null,
        qrDataUrl: null,
        error: null
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const initialState: Omit<MfaState, 'isEnabled'> = {
  step: 'idle',
  setupData: null,
  qrDataUrl: null,
  recoveryCodes: null,
  error: null
};

export function useMfa(initialHasTotp: boolean) {
  const router = useRouter();
  const [reducerState, dispatch] = useReducer(mfaReducer, initialState);

  const { execute: executeSetup, isExecuting: isSetupExecuting } = useAction(
    totpSetup,
    {
      onSuccess: ({ data }) => {
        if (data) dispatch({ type: 'START_SETUP', payload: data });
      },
      onError: ({ error }) => {
        const message =
          error.serverError ?? firstValidationError(error.validationErrors);
        dispatch({
          type: 'ENABLE_ERROR',
          payload: getErrorMessage(message, 'Erro ao carregar configuração.')
        });
      }
    }
  );

  const { execute: executeEnable, isExecuting: isEnableExecuting } = useAction(
    totpEnable,
    {
      onSuccess: ({ data }) => {
        dispatch({
          type: 'ENABLE_SUCCESS',
          payload: data?.recoveryCodes ?? []
        });
        router.refresh();
      },
      onError: ({ error }) => {
        const message =
          error.serverError ?? firstValidationError(error.validationErrors);
        dispatch({
          type: 'ENABLE_ERROR',
          payload: getErrorMessage(message, 'Código inválido.')
        });
      }
    }
  );

  const { execute: executeDisable, isExecuting: isDisableExecuting } =
    useAction(totpDisable, {
      onSuccess: () => {
        dispatch({ type: 'DISABLE_SUCCESS' });
        router.refresh();
      },
      onError: ({ error }) => {
        const message =
          error.serverError ?? firstValidationError(error.validationErrors);
        dispatch({
          type: 'DISABLE_ERROR',
          payload: getErrorMessage(message, 'Código inválido.')
        });
      }
    });

  useEffect(() => {
    if (!reducerState.setupData?.otpauthUrl) return;
    let isCancelled = false;
    QRCode.toDataURL(reducerState.setupData.otpauthUrl, { width: 200 }).then(
      (url) => {
        if (!isCancelled) dispatch({ type: 'SET_QR', payload: url });
      }
    );
    return () => {
      isCancelled = true;
    };
  }, [reducerState.setupData?.otpauthUrl]);

  const startEnable = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
    executeSetup({});
  };

  const submitEnable = (totpCode: string): void => {
    if (!reducerState.setupData) return;
    dispatch({ type: 'SET_ERROR', payload: null });
    executeEnable({
      secret: reducerState.setupData.secret,
      totpCode
    });
  };

  const submitDisable = (totpCode: string): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
    executeDisable({ totpCode });
  };

  const finishRecovery = (): void => {
    dispatch({ type: 'RECOVERY_DONE' });
    router.refresh();
  };

  const cancelSetup = (): void => {
    dispatch({ type: 'RESET_SETUP' });
  };

  const state: MfaState = {
    ...reducerState,
    isEnabled: initialHasTotp
  };

  const isExecuting =
    isSetupExecuting || isEnableExecuting || isDisableExecuting;

  return {
    state,
    startEnable,
    submitEnable,
    submitDisable,
    finishRecovery,
    cancelSetup,
    isExecuting
  };
}
