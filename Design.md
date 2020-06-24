# NewRelic OSS CLI Design

We would like to programmatically create pull requests on large numbers of repositories with minimal effort (https://github.com/newrelic/newrelic-oss-cli/issues/7), especially within our organization.

### Notes on the Problem

Speaking with Melissa and Frederick, it seems that in the general case this issue is part of an eventual turnkey method for managing the nitty gritty of OSS repositories. I found a number of interesting resources regarding repository management (see [Other Notes](#other-notes)), which I can overview if needed. 

One takeaway is we would likely want to run a linting engine such as [repolinter](https://github.com/todogroup/repolinter) against New Relic repositories, create automatic PRs where possible, and open an issue where a fix is not available. This leads to the creation of two separate tools: a repo linter with fixing rules, and something to automatically apply the repo linters fixes to the repository. We will ignore the repo linter for now, as it is outside the scope of this feature.

We would likely want the automatic application process to work both inside and outside CI, the automatic application tool can be split into two commands two commands: `administrate`, where the PR is created using the Github API, and `fix`, where the PR is created by the CI system. `administrate` would allow for the targeting of hundreds of remote repositories which should be updated, whereas `fix` would only work in the local directory.

The `fix` command is out of scope for this feature (it would basically be a wrapper for the repo linter), so for the moment this document will address the PR-creation aspect of `administrate` only.

## Ideas

### Evaluation Criteria
 * Functionality
   * Read/write/modify of all repositories in organization
   * Automatic pull request creation
   * Conditional modifications (based on repository contents, user input?) for each repository
   * Automatic verification/configuration of repository settings?
 * Ease of Use
   * One-command/Many commands
   * Requires scripting knowledge (bash, JS, etc.)
   * Requires tool installation/configuration (NPM, git, etc.)
   * Allows for local repository file access (not API only)
 * Extensibility
   * Ease of future development, assuming similar use cases
   * Maintainability
   * Cross-platform-ability
 * Development Time

### Google's Github Repo Automation Toolkit

Unsurprisingly, Google has created a tool that will automatically clone, patch, and pull request files given a list of relevant repositories: [github-repo-automation](https://github.com/googleapis/github-repo-automation). Repositories are enumerated via a published JSON document or local YAML config. This tool is not officially supported by Google, and as a result may need adoption. This tool comes with two interfaces: a CLI, which requires bash commands to make repository changes, and a JS API, which gives the developer full scripting capabilities. Depending on our needs, we could either use this tool's CLI as is, add to this tool's CLI functionality to better suite our needs, or create a separate CLI which build's off of or copies this tool's API. In the short term simply using the tool as is would probably suffice, though I find bash scripting to be a less ergonomic medium than JS or python.

This tool:
 1. Enumerates repositories using the github api
 2. Clones them using git
 3. Modifies them using a specified bash command (CLI) or a JS function (API)
 4. Creates a separate branch and commits changes using the github API
 5. Creates a pull request using the github API.

#### CLI
| Functionality | Ease of Use | Extensibility | Development Time |
|---|---|---|---|
| ✅ | Scripting Knowledge, tool installation | Allows for any script, but does not encourage reuse. Scripts are not cross-platform. | Very Low |

#### API
| Functionality | Ease of Use | Extensibility | Development Time |
|---|---|---|---|
| ✅ | CLI knowledge, tool installation | Requires knowledge of git, node, and JS. Modularity up to Developer. | Medium |

### Github Actions / Travis CI

Github actions provides a comprehensive toolkit for automating modifications to repositories, and would be an excellent modification method for more advanced tasks that require builds, testing, etc. Github actions, however, doesn't appear to support a "one-off" job (Travis CI does), meaning a temporary actions job would have to modify any existing workflow and make sure to replace it when done. In addition, user input is a non-starter, but could be avoided with proper configuration.

| Functionality | Ease of Use | Extensibility | Development Time |
|---|---|---|---|
| 🟡 (Minus user input) | CLI knowledge, tool installation | Requires knowledge of Github Actions. Highly modular. | High |

### Clever use of the Github API

As of now, the github graphql api cannot add git objects, but the github REST api can. Given this, the entire process could be automated through a series of calls to the Github API, probably some sort of filter->map->reduce pipeline. This would have the downside of limiting our actions to only ones that can be performed through the GitHub API, and forcing developers to script all actions through REST API calls (disallowing the use of tools such as repolinter, which requires a local git repository).

| Functionality | Ease of Use | Extensibility | Development Time |
|---|---|---|---|
| 🟡 | CLI knowledge, tool installation | Requires knowledge of GitHub REST API, commands will likely be non-modular, no local file access. | Medium-High |

## Conclusion

The Github Repo Automation Toolkit API is probably goin

## Other Notes

Useful Microsoft blog on scaling GitHub: https://www.jeff.wilcox.name/2019/06/scaling-25k/.

Repolinter does not yet have automatic fixes, but as it is open source it is certainly possible we could add that functionality.

We also will probably want to create some default community files for New Relic: https://help.github.com/en/github/building-a-strong-community/.

## Resources
 * https://help.github.com/en/github/building-a-strong-community/creating-a-default-community-health-file
 * https://github.com/amzn/oss-dashboard
 * https://www.jeff.wilcox.name/2019/06/
 * https://github.com/todogroup/awesome-oss-mgmt
 * https://github.com/googleapis/github-repo-automation
 * https://github.com/todogroup/repolinter