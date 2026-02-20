import { renderContributorStatsCard } from '@/cards/stats-card';
import {
  clampValue,
  CONSTANTS,
  parseArray,
  parseBoolean,
  renderError,
} from '@/common/utils';
import { fetchContributorStats } from '@/fetchContributorStats';
import { fetchAllContributorStats } from '@/fetchAllContributorStats';
import { isLocaleAvailable } from '@/translations';
import express from 'express';
import compression from 'compression';

// Initialize Express
const app = express();
app.use(compression());

// Create GET request
app.get('/api', async (req, res) => {
  const {
    username,
    hide,
    hide_repo_regex,
    hide_title,
    hide_border,
    hide_contributor_rank,
    order_by,
    line_height,
    title_color,
    icon_color,
    text_color,
    bg_color,
    custom_title,
    border_radius,
    border_color,
    theme,
    cache_seconds,
    locale,
    combine_all_yearly_contributions,
    limit,
    width,
    icon_padding_x,
  } = req.query;
  res.set('Content-Type', 'image/svg+xml');

  if (locale && !isLocaleAvailable(locale)) {
    return res.send(renderError('Something went wrong', 'Language not found'));
  }

  try {
    const result = await (combine_all_yearly_contributions
      ? fetchAllContributorStats(username)
      : fetchContributorStats(username));
    const name = result.name;
    const contributorStats = result.repositoriesContributedTo.nodes;

    const cacheSeconds = clampValue(
      parseInt((cache_seconds as string) || CONSTANTS.FOUR_HOURS, 10),
      CONSTANTS.FOUR_HOURS,
      CONSTANTS.ONE_DAY,
    );

    res.setHeader('Cache-Control', `public, max-age=${cacheSeconds}`);

    res.send(
      await renderContributorStatsCard(username, name, contributorStats, {
        hide: parseArray(hide),
        hide_repo_regex: Array.isArray(hide_repo_regex)
          ? hide_repo_regex[0]
          : hide_repo_regex,
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        hide_contributor_rank: parseBoolean(hide_contributor_rank),
        order_by,
        line_height,
        title_color,
        icon_color,
        text_color,
        bg_color,
        custom_title,
        border_radius,
        border_color,
        theme,
        locale: locale ? (locale as string).toLowerCase() : null,
        limit,
        width: width ? width : 495,
        icon_padding_x: icon_padding_x ? parseInt((icon_padding_x as string)) : 0,
      }),
    );
  } catch (err: any) {
    return res.send(renderError(err.message, err.secondaryMessage));
  }
});

app.all("/*", (req, res) => {
    return res.redirect("https://github.com/galaxy-sea/repository-contribution-stats")
})

const port = 9999;

app.listen(port, () => {
  console.log(`Express app listening on port ${port}`);
});
