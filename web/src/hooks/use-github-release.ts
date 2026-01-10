import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
}

export function useGitHubRelease(): UseQueryResult<GitHubRelease> {
  return useQuery<GitHubRelease>({
    queryKey: ['github-release'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.github.com/repos/jantonca/easytax-au/releases/latest',
      );
      if (!response.ok) {
        throw new Error('Failed to fetch release');
      }
      return response.json() as Promise<GitHubRelease>;
    },
    // Cache for 1 hour
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60,
    // Don't retry on failure (GitHub API rate limits)
    retry: false,
    // Only fetch when explicitly enabled
    enabled: false,
  });
}
