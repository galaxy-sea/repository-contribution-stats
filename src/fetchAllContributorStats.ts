import _ from 'lodash';
import { requestGitHubGraphQL } from '@/githubGraphql';

/**
 * The Fetch All Contributor Stats Function.
 *
 * This function combines all the yearly `contributionsCollection` from the
 * github graphql APIs.
 *
 * @param {String} username The target github username for contribution stats.
 *
 * @return {*}
 */
export async function fetchAllContributorStats(username, token) {
  const {
    user: {
      name,
      contributionsCollection: { contributionYears },
    },
  } = await requestGitHubGraphQL<any>(
    `query {
      user(login: ${JSON.stringify(username)}) {
        name
        contributionsCollection {
          contributionYears
        }
      }
    }`,
    token,
  );

  const yearlyContributionFields = (contributionYears as string[])
    .map(
      (contributionYear, index) => `
        year${index}: contributionsCollection(from: "${contributionYear}-01-01T00:00:00Z") {
          commitContributionsByRepository(maxRepositories: 100) {
            contributions {
              totalCount
            }
            repository {
              owner {
                avatarUrl
              }
              name
              nameWithOwner
              stargazerCount
            }
          }
        }
      `,
    )
    .join('\n');

  const yearlyContributionData = await requestGitHubGraphQL<any>(
    `query {
      user(login: ${JSON.stringify(username)}) {
        ${yearlyContributionFields}
      }
    }`,
    token,
  );

  return {
    name,
    repositoriesContributedTo: {
      nodes: _.chain(
        Object.values(yearlyContributionData.user).flatMap(
          ({ commitContributionsByRepository }: any) =>
            commitContributionsByRepository.map(
              ({ contributions, repository }) => [
                repository.nameWithOwner,
                repository,
                contributions.totalCount,
              ],
            ),
        ),
      )
        .groupBy(([key]) => key)
        .map((groupedArrays) => {
          const key = groupedArrays[0][0];
          const totalCount = _.sumBy(groupedArrays, ([, , value]) => value);
          return {
            ...groupedArrays[0].slice(1, -1)[0],
            numOfMyContributions: totalCount,
          };
        })
        .value(),
    },
  };
}
