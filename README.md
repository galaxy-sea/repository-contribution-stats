<p align="center">
 <img width="100px" src="https://res.cloudinary.com/anuraghazra/image/upload/v1594908242/logo_ccswme.svg" align="center" alt="GitHub Readme Stats" />
 <h2 align="center">GitHub Repository Contribution Stats</h2>
 <p align="center">Get dynamically generated your github repository contribution stats on your READMEs!</p>
</p>

# Features

- [GitHub Repository Contribution Stats Card](#github-repository-contribution-stats-card)
- [Themes](#themes)

# GitHub Repository Contribution Stats Card

Copy and paste this into your markdown content, and that's it. Simple!

My project, which is based on [github-readme-stats](https://github.com/anuraghazra/github-readme-stats), focuses on showing GitHub repository contribution stats and applies the typescript to the original project. Refer to [ISSUE#2027](https://github.com/anuraghazra/github-readme-stats/issues/2027). Thank you [@anuraghazra](https://github.com/anuraghazra) for the awesome open-source project!

After I have applied this, I became enthusiastic about contributing to open source because I can see all my contributions in my Github Readme! If you guys star and let your friends know this, I really appreciate that!

Change the `?username=` value to your GitHub username.

```md
![Taehyun's GitHub Repository Contribution stats](https://repository-contribution-stats.vercel.app/api?username=galaxy-sea)
```

### Demo

![Taehyun's GitHub Repository Contribution stats](./img/galaxy-sea.png)

\_Note: Available ranks are S+ (over 10000), S (over 1000), A+ (over 500), A (over 100), B+ (over 50) and B (over 1).

### Limiting contribution repos to show

To limit contribution repos to show, you can pass a query parameter `&limit=` with number value. For example, if you want to show only 5 contribution repos, then add **limit=5** like the following one.

```md
![Taehyun's GitHub Repository Contribution stats](https://repository-contribution-stats.vercel.app/api?username=galaxy-sea&limit=5)
```

### Hiding rank stats

To hide specific ranks, you can pass a query parameter `&hide=` with comma-separated rank values. If you need to add plus rank (ex. B+) to hide arrays , it is always safe to replace pluses with %2B

```md
![Taehyun's GitHub Repository Contribution stats](https://repository-contribution-stats.vercel.app/api?username=galaxy-sea&hide=B,B%2B)
```

### Showing contributor rank stats

To show contributor ranks, you can pass a query parameter `&hide_contributor_rank=false`.

```md
![Taehyun's GitHub Repository Contribution stats](https://repository-contribution-stats.vercel.app/api?username=galaxy-sea&hide=B,B%2B&hide_contributor_rank=false&limit=5)
```

### Hiding repositories by regex

To hide repositories by name, you can pass `&hide_repo_regex=` with a JavaScript regex pattern. Matched repositories will not be rendered.

```md
![Taehyun's GitHub Repository Contribution stats](https://repository-contribution-stats.vercel.app/api?username=galaxy-sea&hide_repo_regex=^test)
```

You can also pass `/pattern/flags` style values:

```md
![Taehyun's GitHub Repository Contribution stats](https://repository-contribution-stats.vercel.app/api?username=galaxy-sea&hide_repo_regex=%2Fdemo%2Fi)
```

### Configuring the sorting order for gitHub contributor stats

To specify the sorting order based on either contributions or star count or repository name length, include the &order_by= query parameter with the options `stars` or `contributions` or `length` in your request URL.

```md
![Taehyun's GitHub Repository Contribution stats](https://repository-contribution-stats.vercel.app/api?username=galaxy-sea&hide=B,B%2B&hide_contributor_rank=false&limit=5&order_by=contributions)
```

### Including all contributions, not only recent contributions

By default, the card is generated from GitHub's GraphQL API `repositoriesContributedTo`, which only includes recent contributions. To include all contributions, add `&combine_all_yearly_contributions=true` query parameter, which will let the card be generated from GitHub's GraphQL API `contributionsCollection`, including all contributions.

```md
![Taehyun's GitHub Repository Contribution stats](https://repository-contribution-stats.vercel.app/api?username=galaxy-sea&combine_all_yearly_contributions=true)
```

### Card width, stats icons coordinate

The repository name and username are too long, you can use `&width=600&icon_padding_x=100` to adjust the card width

<img src="./img/width.png" width="400">

### Themes

With inbuilt themes, you can customize the look of the card without doing any [manual customization](#customization).

Use `&theme=THEME_NAME` parameter like so :-

```md
![Taehyun's GitHub Repository Contribution stats](https://repository-contribution-stats.vercel.app/api?username=galaxy-sea&hide=B&theme=default)
```

#### All inbuilt themes:- in <a href="https://github.com/anuraghazra/github-readme-stats">github-readme-stats' themes</a>

dark, radical, merko, gruvbox, tokyonight, onedark, cobalt, synthwave, highcontrast, dracula

You can look at a preview for [all available themes](./themes/README.md) or checkout the [theme config file](./themes/index.js) & **you can also contribute new themes** if you like :D

> Note: The minimum of cache_seconds is currently 4 hours as a temporary fix for PATs exhaustion.


## Contribution

Contributions are welcome!

Made with :fire: and TypeScript.
