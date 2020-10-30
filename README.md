[![New Relic Experimental header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Experimental.png)](https://opensource.newrelic.com/oss-category/#new-relic-experimental)

# newrelic-oss-cli

![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/newrelic/newrelic-oss-cli?include_prereleases&sort=semver) [![Snyk](https://snyk.io/test/github/newrelic/newrelic-oss-cli/badge.svg)](https://snyk.io/test/github/newrelic/newrelic-oss-cli)[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

This is a monorepo for NewRelic's "Open Source Software" (oss) CLI. A collection of tools and utilities for generating, validating, and releasing an open-source project using our guidelines.

## Usage

![Screenshot #1](screenshots/screenshot_01.png)

### Third Party Notice Generation (for npm-based projects)

Generate a manifest (config) file - `oss third-party manifest`
Generate a formatted notices file - `oss third-party notices`

See more in (/packages)

## What problem(s) does this library solve?

- Bullet point sentence giving the user a heads up about what to expect.
- Second bullet focused on a paragraph that might be a good first draft for [developer.newrelic.com](https://developer.newrelic.com) or NPM.

## What do you need to make this work?

## Getting started

## Installation

```bash
npm install -g @newrelic/newrelic-oss-cli
```

## Open Source License

This project is distributed under the [Apache 2 license](LICENSE).

## Support

New Relic has open-sourced this project. This project is provided AS-IS WITHOUT WARRANTY OR DEDICATED SUPPORT. Issues and contributions should be reported to the project here on GitHub.

We encourage you to bring your experiences and questions to the [Explorers Hub](https://discuss.newrelic.com) where our community members collaborate on solutions and new ideas.

### Community

New Relic hosts and moderates an online forum where customers can interact with New Relic employees as well as other customers to get help and share best practices. Like all official New Relic open source projects, there's a related Community topic in the New Relic Explorers Hub. You can find this project's topic/threads here:

[https://discuss.newrelic.com](https://discuss.newrelic.com)

### Issues / Enhancement Requests

Issues and enhancement requests can be submitted in the [Issues tab of this repository](../../issues). Please search for and review the existing open issues before submitting a new issue.

## Contributing

Contributions are welcome (and if you submit a Enhancement Request, expect to be invited to contribute it yourself :grin:). Please review our [Contributors Guide](CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource+newrelic-oss-cli@newrelic.com.

## Local Development

This is a [Lerna](https://github.com/lerna/lerna) monorepo. Developing locally has a few caveats.

Useful commands:

`lerna clean` - remove all node_modules folders
`lerna link` - link local dependencies
`lerna bootstrap` - install all dependencies (install node_modules folder)
`lerna list` - list packages

You can run commands directly from the cloned repo like this:

```bash
~/location-of-repo/packages/newrelic-oss-cli/bin run commands
```

### Plugin Development

To "install" a plugin you want to develop, do not include it in the package.json and do not install it with `oss plugins:install YOURPLUGIN`, this will pull the npm version of the plugin.

Instead you want to "link" it for local development with:
`./packages/newrelic-oss-cli/bin/run plugins:link <path to your plugin>`

## Publishing a new version

From the root of this project:

1. `lerna clean` - removes all `node_modules` folders
1. `lerna link` - this pulls in local plugins through symbolical links
1. `lerna bootstrap` - installs dependencies into `node_modules`

From inside of `/packages/newrelic-oss-cli`:

1. Update the version in `package.json` and `package-lock.json`
1. `npm publish --dry-run`
1. `npm publish`
