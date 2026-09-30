type GitHubGraphQLError = {
  message: string;
};

type GitHubGraphQLResponse<T> = {
  data?: T;
  errors?: GitHubGraphQLError[];
};

export const requestGitHubGraphQL = async <T>(
  query: string,
  token: string,
): Promise<T> => {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'repository-contribution-stats',
    },
    body: JSON.stringify({ query }),
  });

  const payload = (await response.json()) as GitHubGraphQLResponse<T>;
  if (!response.ok || payload.errors?.length) {
    const message =
      payload.errors?.map((error) => error.message).join('; ') ||
      `GitHub API request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error('GitHub API response did not include data');
  }

  return payload.data;
};
