import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE
} from 'next-safe-action';
import { z } from 'zod';

import {
  ForbiddenError,
  NotFoundError,
  PreConditionError,
  UnauthorizedError,
  ValidationError
} from '@workspace/common/errors';

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (
      e instanceof ValidationError ||
      e instanceof ForbiddenError ||
      e instanceof NotFoundError ||
      e instanceof PreConditionError ||
      e instanceof UnauthorizedError
    ) {
      return e.message;
    }
    if (e instanceof Error && e.message) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z.object({
      actionName: z.string()
    });
  }
});
