import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { Clock, Download, Info, Loader2, RefreshCw } from 'lucide-react';
import { SettingsTabs } from '@/features/settings/components/settings-tabs';
import { useVersion } from '@/hooks/use-version';
import { useUpdateCheck } from '@/hooks/use-update-check';
import { downloadDatabaseBackup } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';

const RATE_LIMIT_KEY = 'backup_rate_limit_until';
const RATE_LIMIT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function AboutPage(): ReactElement {
  const { data: version, isLoading, isError } = useVersion();
  const { updateInfo, isChecking, checkError, checkNow } = useUpdateCheck();
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [rateLimitExpiry, setRateLimitExpiry] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Check for existing rate limit on mount
  useEffect(() => {
    const checkStoredLimit = (): void => {
      const storedExpiry = localStorage.getItem(RATE_LIMIT_KEY);
      if (storedExpiry) {
        const expiryTime = parseInt(storedExpiry, 10);
        if (expiryTime > Date.now()) {
          setRateLimitExpiry(expiryTime);
        } else {
          localStorage.removeItem(RATE_LIMIT_KEY);
        }
      }
    };
    checkStoredLimit();
  }, []);

  // Update countdown timer every second
  useEffect(() => {
    const updateCountdown = (): void => {
      if (!rateLimitExpiry) {
        setRemainingSeconds(0);
        return;
      }

      const remaining = Math.max(0, Math.ceil((rateLimitExpiry - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        setRateLimitExpiry(null);
        localStorage.removeItem(RATE_LIMIT_KEY);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [rateLimitExpiry]);

  function formatCountdown(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  function handleExportBackup(): void {
    setIsExporting(true);

    downloadDatabaseBackup()
      .then(() => {
        showToast({
          title: 'Database backup downloaded',
          description: 'Your backup has been saved as a SQL file.',
          variant: 'success',
        });
      })
      .catch((err: unknown) => {
        // Check if it's a rate limit error
        if (err instanceof Error && err.message.includes('Rate limit exceeded')) {
          const expiryTime = Date.now() + RATE_LIMIT_DURATION;
          setRateLimitExpiry(expiryTime);
          localStorage.setItem(RATE_LIMIT_KEY, expiryTime.toString());

          showToast({
            title: 'Rate limit exceeded',
            description: 'Please wait 5 minutes before exporting again.',
            variant: 'error',
          });
        } else {
          showToast({
            title: 'Failed to export backup',
            description: err instanceof Error ? err.message : 'Please try again later.',
            variant: 'error',
          });
        }
      })
      .finally(() => {
        setIsExporting(false);
      });
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <SettingsTabs />
      <header className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            About
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Application version and system information.
          </p>
        </div>
      </header>

      {isLoading && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-700 dark:border-t-slate-400" />
            Loading version information...
          </div>
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/60 p-4 text-sm text-red-200 dark:border-red-900/60 dark:bg-red-950/60">
          We couldn&apos;t load version information right now. Please try again shortly.
        </div>
      )}

      {!isLoading && !isError && version && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  EasyTax-AU
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Local-first tax management for Australian sole traders
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
                  Version
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {version.version}
                </dd>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
                  Environment
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {version.environment}
                </dd>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
                  Node.js
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {version.nodeVersion}
                </dd>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
                  Application
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {version.name}
                </dd>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-50">
                About this application
              </h3>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>
                  EasyTax-AU helps Australian sole traders manage expenses, incomes, and GST
                  reporting for BAS (Business Activity Statement) compliance.
                </p>
                <p>
                  All financial data is stored locally in an encrypted PostgreSQL database. No data
                  is sent to external servers.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Australian Financial Year: July 1 - June 30 | GST Rate: 10%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isError && version && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                Database Backup
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Download a complete SQL backup of your database for safekeeping.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting || remainingSeconds > 0}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-emerald-700 bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600 dark:border-emerald-600 dark:bg-emerald-700 dark:hover:bg-emerald-600 dark:focus:ring-offset-slate-900 sm:w-auto"
                aria-label="Export database backup"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : remainingSeconds > 0 ? (
                  <>
                    <Clock className="h-4 w-4" />
                    Wait {formatCountdown(remainingSeconds)}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export Backup
                  </>
                )}
              </button>
              {remainingSeconds > 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Rate limit active. You can export again in {formatCountdown(remainingSeconds)}.
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Rate limited to 3 exports per 5 minutes. The backup file can be restored using{' '}
                  <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">psql</code>.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Check Card */}
      {!isLoading && !isError && version && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                Software Updates
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Check for the latest version from GitHub.
              </p>
            </div>

            {updateInfo?.hasUpdate && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/20">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                    <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      Update Available
                    </h3>
                    <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                      Version {updateInfo.latestVersion} is available. You are currently running
                      version {updateInfo.currentVersion}.
                    </p>
                    <a
                      href={updateInfo.releaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      View on GitHub →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {updateInfo && !updateInfo.hasUpdate && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You are running the latest version ({updateInfo.currentVersion}).
              </p>
            )}

            {checkError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Unable to check for updates. Please check your internet connection.
              </p>
            )}

            <button
              type="button"
              onClick={checkNow}
              disabled={isChecking}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900 sm:w-auto"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Check for Updates
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
