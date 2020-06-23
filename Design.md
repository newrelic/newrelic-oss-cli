# NewRelic OSS CLI Design

We would like to programmatically create pull requests on large numbers of repositories with minimal effort (https://github.com/newrelic/newrelic-oss-cli/issues/7), especially within our organization.

## Ideas

### Google's Github Repo Automation Toolkit

Unsurprisingly, one of the FANG companies has created a tool that will automatically clone, patch, and pull request files given a list of relevant repositories: [github-repo-automation](https://github.com/googleapis/github-repo-automation). Repositories are enumerated via a published JSON document or local YAML config. This tool is not officially supported by Google, and as a result may need adoption. This tool comes with two interfaces: a CLI, which requires bash commands to make repository changes, and a JS API, which gives the developer full scripting capabilities. Depending on our needs, we could either use this tool's CLI as is, add to this tool's CLI functionality to better suite our needs, or create a separate CLI which build's off of or copies this tool's API. In the short term simply using the tool as is would probably suffice, though I find bash scripting to be a less ergonomic medium than JS or python.

This tool locally clones and modifies, which would be a simple implementation strategy if we wanted to implement it ourselves.

### Github Actions / Travis CI

### Clever use of the Github API

As of now, the github graphql api cannot add git objects, but the github REST api can. Given this, the entire process could be automated through a series of calls to the Github API, probably some sort of filter->map->reduce pipeline. This would have the downside of limiting our actions to only ones that can be performed through the GitHub API, and forcing developers to script all actions through REST API calls.
