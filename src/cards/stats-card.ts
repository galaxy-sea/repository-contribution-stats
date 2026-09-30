import _ from 'lodash';
import { calculateContributionRank } from '@/calculateContributionRank';
import { calculateRank } from '@/calculateRank';
import { Card } from '@/common/Card';
import { I18n } from '@/common/I18n';
import {
  clampValue,
  encodeHTML,
  flexLayout,
  getCardColors,
  getImageBase64FromURL,
  measureText,
} from '@/common/utils';
import { getStyles } from '@/getStyles';
import { statCardLocales } from '@/translations';
import { Contributor, getContributors } from 'getContributors';

const BASE64_REGEX_PREFIXES = ['base64:', 'b64:'];

const decodeBase64RegexParam = (regexParam: string) => {
  const matchedPrefix = BASE64_REGEX_PREFIXES.find((prefix) =>
    regexParam.startsWith(prefix),
  );

  if (!matchedPrefix) {
    return regexParam;
  }

  const encodedValue = regexParam.slice(matchedPrefix.length).trim();
  if (!encodedValue) {
    throw new Error('Empty base64 payload');
  }

  const normalizedValue = encodedValue.replace(/-/g, '+').replace(/_/g, '/');
  const paddedValue = normalizedValue.padEnd(
    normalizedValue.length + ((4 - (normalizedValue.length % 4)) % 4),
    '=',
  );

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(paddedValue)) {
    throw new Error('Invalid base64 payload');
  }

  const binary = atob(paddedValue);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const parseRegexFromParam = (regexParam: string) => {
  const decodedRegexParam = decodeBase64RegexParam(regexParam);
  const regexLiteralMatch = decodedRegexParam.match(/^\/([\s\S]*)\/([a-z]*)$/i);

  if (regexLiteralMatch) {
    const [, pattern, flags] = regexLiteralMatch;
    return new RegExp(pattern, flags);
  }

  return new RegExp(decodedRegexParam);
};

const shouldHideRepo = (
  hideRepoRegex: RegExp | null,
  repositoryNameWithOwner: string,
) => {
  if (!hideRepoRegex) return false;
  hideRepoRegex.lastIndex = 0;
  return hideRepoRegex.test(repositoryNameWithOwner);
};

const isOwnedByUser = (repositoryNameWithOwner: string, username: string) => {
  const [owner] = repositoryNameWithOwner.split('/');
  return owner?.toLowerCase() === username.toLowerCase();
};

const getLimitValue = (limit: string | number) => {
  const parsedLimit = parseInt(String(limit), 10);
  return parsedLimit > 0 ? parsedLimit : Infinity;
};

type RenderRepository = {
  name: string;
  nameWithOwner: string;
  avatarUrl: string;
  stars: number;
  numOfMyContributions: number;
  rank: string;
  contributionRank?: string;
};

const fitRepositoriesWithinSubrequestBudget = ({
  repositories,
  username,
  limit,
  inlineAvatar,
  hideContributorRank,
  subrequestBudget,
}) => {
  const selectedRepositories: RenderRepository[] = [];
  const seenAvatarUrls = new Set<string>();
  const maxRepositories = getLimitValue(limit);
  let remainingBudget =
    typeof subrequestBudget === 'number' ? subrequestBudget : Infinity;

  for (const repository of repositories) {
    if (selectedRepositories.length >= maxRepositories) break;

    let cost = 0;
    if (!hideContributorRank && !isOwnedByUser(repository.nameWithOwner, username)) {
      cost += 1;
    }
    if (inlineAvatar && !seenAvatarUrls.has(repository.avatarUrl)) {
      cost += 1;
    }

    if (cost > remainingBudget) continue;

    selectedRepositories.push(repository);
    remainingBudget -= cost;
    seenAvatarUrls.add(repository.avatarUrl);
  }

  return selectedRepositories;
};

const createTextNode = ({ imageBase64, name, rank, contributionRank, index, height, icon_padding_x }) => {
  const staggerDelay = (index + 3) * 150;
  const escapedImageBase64 = encodeHTML(imageBase64);
  const escapedName = encodeHTML(name);

  const calculateTextWidth = (text) => {
    return measureText(text, 18);
  };
  let min = 230 + icon_padding_x
  let offset = clampValue(calculateTextWidth(name), min, 400);
  offset += offset === min ? 5 : 15;
  let offset2 = offset + 50;

  const contributionRankText = contributionRank?.includes('+')
    ? `<text x="4" y="18.5">
        ${contributionRank}
       </text>`
    : `<text x="7.2" y="18.5">
        ${contributionRank}
       </text>`;

  const rankText = rank.includes('+')
    ? `<text x="4" y="18.5">
        ${rank}
       </text>`
    : `<text x="7.2" y="18.5">
        ${rank}
       </text>`;

  let rankItems = _.isEmpty(contributionRank)
    ? `
    <g data-testid="rank-circle" transform="translate(${offset}, 0)">
      <circle class="rank-circle-rim" cx="12.5" cy="12.5" r="14" />
      <g class="rank-text">
        ${rankText}
      </g>
    </g>
    `
    : `
    <g data-testid="rank-circle" transform="translate(${offset}, 0)">
      <circle class="rank-circle-rim" cx="12.5" cy="12.5" r="14" />
      <g class="rank-text">${contributionRankText}</g>
    </g>
    <g data-testid="rank-circle" transform="translate(${offset2}, 0)">
      <circle class="rank-circle-rim" cx="12.5" cy="12.5" r="14" />
      <g class="rank-text">
        ${rankText}
      </g>
    </g>
    `;

  return `
    <g class="stagger" style="animation-delay: ${staggerDelay}ms" transform="translate(25, 0)">
      <defs>
        <clipPath id="myCircle">
          <circle cx="12.5" cy="12.5" r="12.5" fill="#FFFFFF" />
        </clipPath>
      </defs>
      <image xlink:href="${escapedImageBase64}" width="25" height="25" clip-path="url(#myCircle)"/>
      <g transform="translate(30,16)">
        <text class="stat bold">${escapedName}</text>
      </g>
      ${rankItems}
    </g>
  `;
};

export const renderContributorStatsCard = async (
  username,
  name,
  contributorStats = [] as any,
  options = {} as any,
) => {
  const {
    hide = [],
    hide_repo_regex = '',
    line_height = 25,
    hide_title = false,
    hide_border = false,
    hide_contributor_rank = true,
    order_by = 'stars',
    title_color,
    icon_color,
    text_color,
    bg_color,
    border_radius,
    border_color,
    custom_title,
    theme = 'default',
    locale,
    limit = -1,
    width,
    icon_padding_x,
    githubToken,
    inlineAvatar = true,
    subrequestBudget,
  } = options;

  const orderBy = order_by;
  const lheight = parseInt(String(line_height), 10);
  const hideRepoRegexParam = String(hide_repo_regex || '').trim();
  let hideRepoRegex: RegExp | null = null;
  if (hideRepoRegexParam) {
    try {
      hideRepoRegex = parseRegexFromParam(hideRepoRegexParam);
    } catch (error) {
      throw new Error(`Invalid hide_repo_regex: ${hideRepoRegexParam}`);
    }
  }

  // returns theme based colors with proper overrides and defaults
  const { titleColor, textColor, iconColor, bgColor, borderColor } = getCardColors({
    title_color,
    icon_color,
    text_color,
    bg_color,
    border_color,
    theme,
  });

  const apostrophe = ['x', 's'].includes(name.slice(-1).toLocaleLowerCase()) ? '' : 's';
  const i18n = new I18n({
    locale,
    translations: statCardLocales({ name, apostrophe }),
  });

  const filteredContributorStats = contributorStats.filter((contributorStat) => {
    return !shouldHideRepo(
      hideRepoRegex,
      String(contributorStat.nameWithOwner || ''),
    );
  });

  const rankValues = {
    'S+': 5,
    S: 4,
    'A+': 3,
    A: 2,
    'B+': 1,
    B: 0,
  };

  const sortFunction =
    orderBy == 'stars'
      ? (a, b) => b.stars - a.stars
      : orderBy == 'length'
        ? (a, b) => a.name.length - b.name.length
        : (a, b) =>
            (rankValues[b.contributionRank] || 0) -
            (rankValues[a.contributionRank] || 0);

  const candidateRepositories = filteredContributorStats
    .map((contributorStat) => {
      const { name, nameWithOwner, owner, stargazerCount, numOfMyContributions } =
        contributorStat;

      return {
        name,
        nameWithOwner,
        avatarUrl: owner.avatarUrl,
        stars: stargazerCount,
        numOfMyContributions,
        rank: calculateRank(stargazerCount),
      };
    })
    .filter((repository) => !hide.includes(repository.rank))
    .sort(sortFunction);

  let repositoriesToRender = fitRepositoriesWithinSubrequestBudget({
    repositories: candidateRepositories,
    username,
    limit,
    inlineAvatar,
    hideContributorRank: hide_contributor_rank,
    subrequestBudget,
  });

  if (!hide_contributor_rank) {
    const contributorRequests = repositoriesToRender.map((repository) => {
      if (isOwnedByUser(repository.nameWithOwner, username)) {
        return Promise.resolve(null);
      }

      return getContributors(username, repository.nameWithOwner, githubToken);
    });
    const allContributorsByRepo = await Promise.all(contributorRequests);

    repositoriesToRender = repositoriesToRender
      .map((repository, index) => ({
        ...repository,
        contributionRank: isOwnedByUser(repository.nameWithOwner, username)
          ? 'S+'
          : calculateContributionRank(
              repository.name,
              allContributorsByRepo[index],
              repository.numOfMyContributions,
            ),
      }))
      .sort(sortFunction);
  }

  const imageUrls: string[] = repositoriesToRender.map((repository) => {
    const url = new URL(repository.avatarUrl);
    url.searchParams.append('s', '50');
    return url.toString();
  });

  let images = imageUrls;
  if (inlineAvatar) {
    const uniqueImageUrls: string[] = Array.from(new Set<string>(imageUrls));
    const uniqueImages = await Promise.all(
      uniqueImageUrls.map((imageUrl) => getImageBase64FromURL(imageUrl)),
    );
    const imageByUrl = new Map<string, string>(
      uniqueImageUrls.map((imageUrl, index) => [imageUrl, uniqueImages[index]]),
    );
    images = imageUrls.map((imageUrl) => imageByUrl.get(imageUrl) || imageUrl);
  }

  const transformedContributorStats = repositoriesToRender.map((repository, index) => ({
    ...repository,
    imageBase64: images[index],
  }));

  let statItems = Object.keys(transformedContributorStats).map((key, index) =>
    // create the text nodes, and pass index so that we can calculate the line spacing
    createTextNode({
      ...transformedContributorStats[key],
      index,
      lheight,
      icon_padding_x,
    }),
  );

  // Calculate the card height depending on how many items there are
  // but if rank circle is visible clamp the minimum height to `150`
  const distanceY = 8;
  let height = Math.max(30 + 45 + (statItems.length + 1) * (lheight + distanceY), 150);

  const cssStyles = getStyles({
    titleColor,
    textColor,
    iconColor,
    show_icons: true,
    progress: true,
  });

  const card = new Card({
    customTitle: custom_title,
    defaultTitle: i18n.t('statcard.title'),
    titlePrefixIcon: '',
    width,
    height,
    border_radius,
    icon_padding_x,
    colors: {
      titleColor,
      textColor,
      iconColor,
      bgColor,
      borderColor,
    },
  });

  card.setHideContributorRank(hide_contributor_rank);
  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(cssStyles);

  return card.render(`
    <svg overflow="visible">
      ${flexLayout({
        items: statItems,
        gap: lheight + distanceY,
        direction: 'column',
      }).join('')}
    </svg>
  `);
};
