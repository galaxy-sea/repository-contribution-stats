import { renderContributorStatsCard } from '@/cards/stats-card';
import {
  clampValue,
  CONSTANTS,
  parseArray,
  parseBoolean,
  renderError,
} from '@/common/utils';
import { fetchAllContributorStats } from '@/fetchAllContributorStats';
import { fetchContributorStats } from '@/fetchContributorStats';
import { isLocaleAvailable } from '@/translations';

const svgHeaders = {
  'Content-Type': 'image/svg+xml; charset=utf-8',
};

const MAX_WORKER_LIMIT = 40;
const MAX_WORKER_SUBREQUESTS = 50;
const WORKER_SUBREQUEST_BUFFER = 2;

const getParam = (url: URL, name: string) => {
  const values = url.searchParams.getAll(name);
  if (values.length === 0) return undefined;
  if (values.length === 1) return values[0];
  return values;
};

const getWorkerLimit = (limit: string | string[] | undefined) => {
  if (Array.isArray(limit)) {
    return getWorkerLimit(limit[0]);
  }

  if (!limit) {
    return undefined;
  }

  const parsedLimit = parseInt(String(limit), 10);
  if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
    return undefined;
  }

  return Math.min(parsedLimit, MAX_WORKER_LIMIT);
};

const getAvailableSubrequestBudget = (baseSubrequests: number) => {
  return Math.max(0, MAX_WORKER_SUBREQUESTS - baseSubrequests - WORKER_SUBREQUEST_BUFFER);
};

const shouldInlineAvatar = (
  inlineAvatar: string | string[] | undefined,
  legacyEmbedImages: string | string[] | undefined,
) => {
  const value = inlineAvatar ?? legacyEmbedImages;

  if (Array.isArray(value)) {
    return shouldInlineAvatar(value[0], undefined);
  }

  const parsedValue = parseBoolean(value);
  return typeof parsedValue === 'boolean' ? parsedValue : true;
};

const errorResponse = (message: string, secondaryMessage = '') =>
  new Response(renderError(message, secondaryMessage), {
    headers: svgHeaders,
  });

export const handleStatsRequest = async (
  request: Request,
  githubToken: string,
): Promise<Response> => {
  const url = new URL(request.url);
  const username = getParam(url, 'username');

  if (!username || Array.isArray(username)) {
    return errorResponse('Missing params "username" make sure you pass the parameters in URL');
  }

  if (!githubToken) {
    return errorResponse(
      'Missing GitHub token',
      'Set GITHUB_PERSONAL_ACCESS_TOKEN with `wrangler secret put GITHUB_PERSONAL_ACCESS_TOKEN`',
    );
  }

  const hide = getParam(url, 'hide');
  const hideRepoRegex = getParam(url, 'hide_repo_regex');
  const locale = getParam(url, 'locale');
  const limit = getWorkerLimit(getParam(url, 'limit'));
  const inlineAvatar = shouldInlineAvatar(
    getParam(url, 'inline_avatar'),
    getParam(url, 'embed_images'),
  );

  if (typeof locale === 'string' && !isLocaleAvailable(locale)) {
    return errorResponse('Something went wrong', 'Language not found');
  }

  try {
    const combineAllYearlyContributions =
      parseBoolean(getParam(url, 'combine_all_yearly_contributions')) === true;
    const baseSubrequests = combineAllYearlyContributions ? 2 : 1;
    const result = await (combineAllYearlyContributions
      ? fetchAllContributorStats(username, githubToken)
      : fetchContributorStats(username, githubToken));
    const name = result.name;
    const contributorStats = result.repositoriesContributedTo.nodes;

    const cacheSeconds = clampValue(
      parseInt(String(getParam(url, 'cache_seconds') || CONSTANTS.FOUR_HOURS), 10),
      CONSTANTS.FOUR_HOURS,
      CONSTANTS.ONE_DAY,
    );

    const svg = await renderContributorStatsCard(username, name, contributorStats, {
      hide: parseArray(typeof hide === 'string' ? hide : undefined),
      hide_repo_regex: Array.isArray(hideRepoRegex)
        ? hideRepoRegex[0]
        : hideRepoRegex,
      hide_title: parseBoolean(getParam(url, 'hide_title')),
      hide_border: parseBoolean(getParam(url, 'hide_border')),
      hide_contributor_rank: parseBoolean(getParam(url, 'hide_contributor_rank')),
      order_by: getParam(url, 'order_by'),
      line_height: getParam(url, 'line_height'),
      title_color: getParam(url, 'title_color'),
      icon_color: getParam(url, 'icon_color'),
      text_color: getParam(url, 'text_color'),
      bg_color: getParam(url, 'bg_color'),
      custom_title: getParam(url, 'custom_title'),
      border_radius: getParam(url, 'border_radius'),
      border_color: getParam(url, 'border_color'),
      theme: getParam(url, 'theme'),
      locale: typeof locale === 'string' ? locale.toLowerCase() : null,
      limit,
      width: getParam(url, 'width') || 495,
      icon_padding_x: getParam(url, 'icon_padding_x')
        ? parseInt(String(getParam(url, 'icon_padding_x')), 10)
        : 0,
      githubToken,
      inlineAvatar,
      subrequestBudget: getAvailableSubrequestBudget(baseSubrequests),
    });

    return new Response(svg, {
      headers: {
        ...svgHeaders,
        'Cache-Control': `public, max-age=${cacheSeconds}`,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message, err.secondaryMessage);
  }
};
