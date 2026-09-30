/*
 * This file is part of the Github Contributor Stats.
 *
 * (c) TaehyunHwang <eeht1717@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { requestGitHubGraphQL } from '@/githubGraphql';

/**
 * The Fetch Contributor Stats Function.
 *
 * This function holds the request for the github graphql APIs, which includes
 * recent commit contributions.
 *
 * @param {String} username The target github username for contribution stats.
 *
 * @return {*}
 */
const fetchContributorStats = async (username, token) => {
  const data = await requestGitHubGraphQL<any>(
    `query {
      user(login: ${JSON.stringify(username)}) {
        name
        repositoriesContributedTo(first: 100, contributionTypes: COMMIT) {
          nodes {
            owner {
              avatarUrl
            }
            name
            nameWithOwner
            stargazerCount
          }
        }
      }
    }`,
    token,
  );

  if (!data.user) {
    throw new Error('User not found');
  }

  return data.user;
};

export { fetchContributorStats };
