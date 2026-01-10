import { useEffect, useMemo } from 'react';
import { useGitHubRelease } from './use-github-release';
import { useVersion } from './use-version';

const LAST_CHECK_KEY = 'update_last_check';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
}

export interface UseUpdateCheckReturn {
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  checkError: boolean;
  checkNow: () => void;
}

export function useUpdateCheck(): UseUpdateCheckReturn {
  const { data: currentVersion } = useVersion();
  const { data: release, refetch, isLoading, isError } = useGitHubRelease();

  // Auto-check once per day
  useEffect(() => {
    const shouldAutoCheck = (): boolean => {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      if (!lastCheck) return true;
      const timeSinceCheck = Date.now() - parseInt(lastCheck, 10);
      return timeSinceCheck > CHECK_INTERVAL;
    };

    if (currentVersion && shouldAutoCheck()) {
      void refetch();
      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
    }
  }, [currentVersion, refetch]);

  // Compare versions when both available using useMemo instead of useEffect + setState
  const updateInfo = useMemo((): UpdateInfo | null => {
    if (currentVersion && release) {
      const current = currentVersion.version;
      const latest = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
      const hasUpdate = isNewerVersion(latest, current);

      return {
        hasUpdate,
        currentVersion: current,
        latestVersion: latest,
        releaseUrl: release.html_url,
      };
    }
    return null;
  }, [currentVersion, release]);

  // Manual check function
  const checkNow = (): void => {
    void refetch();
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
  };

  return {
    updateInfo,
    isChecking: isLoading,
    checkError: isError,
    checkNow,
  };
}

// Semantic version comparison
export function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const latestPart = latestParts[i] || 0;
    const currentPart = currentParts[i] || 0;

    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false;
}
