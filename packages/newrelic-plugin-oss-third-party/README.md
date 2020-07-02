os-third-party-license-generator
================================



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/os-third-party-license-generator.svg)](https://npmjs.org/package/os-third-party-license-generator)
[![Downloads/week](https://img.shields.io/npm/dw/os-third-party-license-generator.svg)](https://npmjs.org/package/os-third-party-license-generator)
[![License](https://img.shields.io/npm/l/os-third-party-license-generator.svg)](https://github.com/newrelic/newrelic/newrelic-oss-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @newrelic/newrelic-plugin-oss-third-party
$ oclif-example COMMAND
running command...
$ oclif-example (-v|--version|version)
@newrelic/newrelic-plugin-oss-third-party/0.0.2 darwin-x64 node-v10.16.3
$ oclif-example --help [COMMAND]
USAGE
  $ oclif-example COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`oclif-example third-party FILE`](#oclif-example-third-party-file)

## `oclif-example third-party FILE`

Generate third party notices

```
USAGE
  $ oclif-example third-party FILE

ARGUMENTS
  FILE  (manifest|notices) What file do you want to update? Use "manifest" to update the third_party_manifest.json
        manifest of third party dependencies. Use "notices" to update the THIRD_PARTY_NOTICES.md file using the content
        of the manifest.

OPTIONS
  --forceUpdate  Force update of manifest file.

DESCRIPTION
  (1) Make sure you have run "npm install" before using this tool. It depends on node_modules.
  (2) Run with "manifest" to update the manifest file (third_party_manifest.json).
  (3) Review the contents of third_party_manifest.json for accuracy and items marked "FOR_REVIEW" that require manual 
  intervention.
  (4) Run with "notices" to update the notices file (THIRD_PARTY_NOTICES.md) using the manifest.
  (5) Review the contents of THIRD_PARTY_NOTICES.md for accuracy.
  (6) Commit and deploy your changes.
  (7) Yay open source!

  WARNING: this tool does not currently handle monorepos.
```

_See code: [src/commands/third-party.js](https://github.com/newrelic/newrelic-oss-cli/blob/v0.0.2/src/commands/third-party.js)_

## Additional Third-Party Notices
If you have additional third party notices which you would like to include, you can place them in a `THIRD_PARTY_NOTICES_ADDENDUM.md` file at the root of the project. To ensure the table of contents is formatted correctly, use the following format for this file:
```Markdown
You can insert a disclaimer about this file here 

<!-- licence -->
## Package/Licence name
Third party content here
<!-- licencestop -->

<!-- licence -->
## Other Package/Licence name
Third party content here
<!-- licencestop -->
```
<!-- commandsstop -->