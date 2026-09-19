import { keys } from '@workspace/monitoring/keys';
import consoleProvider from '@workspace/monitoring/provider/console';
import sentryProvider from '@workspace/monitoring/provider/sentry';

const dsn = keys().NEXT_PUBLIC_MONITORING_SENTRY_DSN;
const useSentry = typeof dsn === 'string' && dsn.length > 0;

const MonitoringProvider = useSentry ? sentryProvider : consoleProvider;

export { MonitoringProvider };
