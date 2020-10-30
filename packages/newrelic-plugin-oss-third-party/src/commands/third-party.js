/* eslint-disable unicorn/catch-error-name */
/* eslint-disable node/no-unsupported-features/es-syntax */
// eslint-disable-next-line node/no-extraneous-require
const {cli} = require('cli-ux')
const {Command, flags} = require('@oclif/command')
const chalk = require('chalk')
const fs = require('fs-extra')
const licenseChecker = require('license-checker')
const semver = require('semver')
const spdxLicenseList = require('spdx-license-list/full')
const util = require('util')

const licenseCheckerInit = util.promisify(licenseChecker.init)

const THIRD_PARTY_MANIFEST_FILE = 'third_party_manifest.json'
const THIRD_PARTY_NOTICES_FILE = 'THIRD_PARTY_NOTICES.md'
const THIRD_PARTY_ADDENDUM_FILE = 'THIRD_PARTY_NOTICES_ADDENDUM.md'

class ThirdPartyCommand extends Command {
  async run() {
    const {args: {file}, flags: {forceUpdate}} = this.parse(ThirdPartyCommand)

    if (!fs.existsSync(THIRD_PARTY_MANIFEST_FILE)) {
      await this.initializeManifest()
    }

    const responsibilityNotice = 'This tool assists with the creation of third party notice files, but it cannot guarantee correctness for all use cases. You are responsible for validating the output and manually correcting any issues.'
    const allowedLicensesNotice = 'This tool does not validate allowed licenses. Use snyk and New Relic\'s open source policies to validate that the licenses you are including are allowed.'
    this.log(chalk.red.inverse(' CAUTION! '))
    this.log(chalk.red(`${responsibilityNotice}\n\n${allowedLicensesNotice}\n`))

    if (file === 'manifest') {
      await this.updateManifest(forceUpdate)
    } else if (file === 'notices') {
      await this.updateNotices()
    }
  }

  async initializeManifest() {
    this.log(chalk.red(`You are missing ${THIRD_PARTY_MANIFEST_FILE} to ` +
        'configure your project. Let\'s set it up!'))
    const projectName = await cli.prompt('What is the user-friendly name of your project (used to reference your project in output)?')
    const projectUrl = await cli.prompt('What is the url for your project (used to link back to your project?')

    const baseConfig = {
      lastUpdated: `${new Date()}`,
      projectName: projectName,
      projectUrl: projectUrl,
      includeDev: true,
    }

    fs.writeJsonSync(THIRD_PARTY_MANIFEST_FILE, baseConfig, {
      spaces: 2,
    })
  }

  async updateManifest(forceUpdate) {
    this.log(chalk.inverse(` Updating ${THIRD_PARTY_MANIFEST_FILE}. `))

    const manifest = await this.getManifest() || {}
    const {
      lastUpdated, includeDev, dependencies, devDependencies, ...otherConfig
    } = manifest

    const updatedDependencies = await this.getUpdatedDependencies(manifest, forceUpdate)
    const updatedManifest = {
      lastUpdated: `${new Date()}`,
      ...otherConfig,
      includeDev,
      ...updatedDependencies,
    }

    await this.setManifest(updatedManifest)

    this.log('')
    const completionMessage = `Finished updating ${THIRD_PARTY_MANIFEST_FILE}. ` +
      'Remember to validate the results before updating the notices and deploying!'
    this.log(chalk.red(completionMessage))
  }

  async getUpdatedDependencies(manifest, forceUpdate) {
    const pkgJson = await this.getPkgJson()
    const licenseCheckerPkgs = await this.getLicenseCheckerPackages()

    const updatedDependencies = {}
    const depFieldsToInclude = this.getDepFields(manifest)
    depFieldsToInclude.forEach(depField => {
      updatedDependencies[depField] = {}
    })

    const namePartsRegex = /(^.+)@(.+)$/

    Object.keys(licenseCheckerPkgs).forEach(pkg => {
      const pkgNameParts = pkg.match(namePartsRegex)
      if (!pkgNameParts) {
        return
      }

      const pkgName = pkgNameParts[1]
      const pkgVersion = pkgNameParts[2]
      const licenseCheckerPkg = licenseCheckerPkgs[pkg]

      depFieldsToInclude.forEach(depField => {
        const pkgInDependencies = pkgJson[depField] && pkgJson[depField][pkgName] &&
          semver.satisfies(pkgVersion, pkgJson[depField][pkgName])

        if (pkgInDependencies) {
          const pkgInOldManifest = manifest[depField] && manifest[depField][pkg] &&
            manifest[depField][pkg].version === pkgVersion

          if (!forceUpdate && pkgInOldManifest) {
            // NOTE: we intentionally do not overwrite old values because this
            // would become really annoying in the cases where someone needs to
            // make manual adjustments.
            const oldPkgWarning = `${pkgName} version ${pkgVersion} is not being ` +
              'updated because it is already in the manifest.'
            this.warn(oldPkgWarning)

            updatedDependencies[depField][pkg] = {
              ...manifest[depField][pkg],
            }
          } else {
            const pkgRange = pkgJson[depField][pkgName]
            updatedDependencies[depField][pkg] =
              this.getProcessedLicenseInfo(pkgName, pkgVersion, pkgRange, licenseCheckerPkg)
          }
        }
      })
    })

    return updatedDependencies
  }

  getProcessedLicenseInfo(pkgName, pkgVersion, pkgRange, licenseCheckerPkg) {
    const FOR_REVIEW = []

    const repoUrl = this.normalizeRepoUrl(licenseCheckerPkg.repository)
    const licenses = licenseCheckerPkg.licenses
    const versionedRepoUrl = `${repoUrl}/tree/v${pkgVersion}`
    const licenseFile = licenseCheckerPkg.licenseFile

    let licenseUrl
    const nodeModulesPath = `node_modules/${pkgName}/`
    if (licenseFile.indexOf?.(nodeModulesPath) >= 0) {
      const licensePath = licenseFile.slice(
        licenseFile.indexOf(nodeModulesPath) + nodeModulesPath.length,
        licenseFile.length)
      licenseUrl = `${repoUrl}/blob/v${pkgVersion}/${licensePath}`
    } else {
      FOR_REVIEW.push('Unable to determine license url.')
      this.warn(`Unable to determine license url for ${pkgName} v${pkgVersion}`)
    }

    let licenseTextSource
    if (licenseFile?.toLowerCase()?.indexOf('license') >= 0) {
      licenseTextSource = 'file'
    } else if (spdxLicenseList[licenses]) {
      licenseTextSource = 'spdx'
    } else {
      licenseTextSource = 'UNKNOWN'
      FOR_REVIEW.push('Unable to determine source for license text.')
      this.warn(`Unable to determine source of license text for ${pkgName} v${pkgVersion}`)
    }

    if (repoUrl?.indexOf('source.datanerd.us') >= 0) {
      FOR_REVIEW.push('Internal dependency.')
      this.warn(`Found an internal dependency for ${pkgName} v${pkgVersion}`)
    }

    if (licenses.toUpperCase().indexOf(' AND ') >= 0 ||
      licenses.toUpperCase().indexOf(' OR ') >= 0) {
      FOR_REVIEW.push('Dual licenses.')
      this.warn(`Found dual license ${licenses} for ${pkgName} v${pkgVersion}.`)
    }

    const licenseInfo = {
      name: pkgName,
      version: pkgVersion,
      range: pkgRange,
      licenses,
      repoUrl,
      versionedRepoUrl,
      licenseFile,
      licenseUrl,
      licenseTextSource,
      publisher: licenseCheckerPkg.publisher,
      email: licenseCheckerPkg.email,
      url: licenseCheckerPkg.url,
    }

    // eslint-disable-next-line unicorn/explicit-length-check
    if (FOR_REVIEW.length) {
      licenseInfo.FOR_REVIEW = FOR_REVIEW
    }

    return licenseInfo
  }

  normalizeRepoUrl(repoUrl) {
    const gitRegex = /^git@(.+):(.+)$/
    const gitMatches = repoUrl.match(gitRegex)

    if (!gitMatches) {
      return repoUrl
    }

    return `https://${gitMatches[1]}/${gitMatches[2]}`
  }

  async updateNotices() {
    this.log(chalk.inverse(` Updating ${THIRD_PARTY_NOTICES_FILE}. `))

    const manifest = await this.getManifest() || {}
    const thirdPartyContent = await this.getNoticeContent(manifest)

    await this.setNotices(thirdPartyContent)

    this.log('')
    const completionMessage = `Finished updating ${THIRD_PARTY_NOTICES_FILE}. ` +
      'Remember to validate the results before deploying!'
    this.log(chalk.red(completionMessage))
  }

  async getNoticeContent(manifest) {
    const projectName = manifest.projectName || 'project'
    const projectUrl = manifest.projectUrl

    const depFieldsToInclude = this.getDepFields(manifest)
    const thirdPartyAddendum = await this.loadThirdPartyAddendum()

    let thirdPartyContent = `# Third Party Notices

The ${projectName} uses source code from third party libraries which carry
their own copyright notices and license terms. These notices are provided
below.

In the event that a required notice is missing or incorrect, please notify us
by e-mailing [open-source@newrelic.com](mailto:open-source@newrelic.com).\n\n`

    if (projectUrl) {
      thirdPartyContent += `For any licenses that require the disclosure of source
code, the source code can be found at [${projectUrl}](${projectUrl}).`
    } else {
      thirdPartyContent += `For any licenses that require the disclosure of source
code, the source code can be found in this repository.`
      this.warn('Missing "projectUrl" field in manifest. Excluding link to project.')
    }

    thirdPartyContent += '\n\n## Content\n'

    depFieldsToInclude.forEach(depField => {
      thirdPartyContent += `\n**[${depField}](${this.mdTitleLink(depField)})**\n\n`

      Object.values(manifest[depField]).forEach(pkg => {
        thirdPartyContent += `* [${pkg.name}](${this.mdTitleLink(pkg.name)})\n`
      })
    })

    if (thirdPartyAddendum) {
      thirdPartyContent += '\n**[Additional Licenses](#additional-licenses)**\n\n'
      for (const add of thirdPartyAddendum)
        thirdPartyContent += `* [${add.title}](${this.mdTitleLink(add.title)})\n`
    }

    thirdPartyContent += '\n'

    depFieldsToInclude.forEach(depField => {
      thirdPartyContent += `\n## ${depField}\n\n`

      Object.values(manifest[depField]).forEach(pkg => {
        const {licenseUrl, licenseFile, licenseTextSource} = pkg
        let licenseContent
        if (licenseTextSource === 'file') {
          try {
            licenseContent = fs.readFileSync(licenseFile)
          } catch (e) {
            this.warn(`Error loading file ${licenseFile} for ${pkg.name} v${pkg.version}.`)
            this.log(chalk.red(e))
          }
        } else if (licenseTextSource === 'spdx') {
          licenseContent = spdxLicenseList[pkg.licenses].licenseText
        } else {
          this.warn(`No license text found for ${pkg.name} v${pkg.version}.`)
        }

        thirdPartyContent += `### ${pkg.name}

This product includes source derived from [${pkg.name}](${pkg.repoUrl}) ([v${pkg.version}](${pkg.versionedRepoUrl})), distributed under the [${pkg.licenses} License](${licenseUrl}):

\`\`\`
${licenseContent}
\`\`\`

`
      })
    })

    if (thirdPartyAddendum) {
      thirdPartyContent += '## Additional Licenses\n\n'
      thirdPartyContent += thirdPartyAddendum.map(t => t.content).join('\n\n')
      thirdPartyContent += '\n'
    }

    return thirdPartyContent
  }

  async loadThirdPartyAddendum() {
    const addendum = await this.getThirdPartyAddendum()
    if (!addendum)
      return
    // scan the document for markdown sections, attempting to build a table of contents
    const start = /^\s*<!--\s*licence\s*-->\s*$/gm
    const end = /^\s*<!--\s*licencestop\s*-->\s*$/gm
    const items = []
    for (;;) {
      if (!start.exec(addendum))
        break
      // find the stop, if it exists
      end.lastIndex = start.lastIndex
      const endMatch = end.exec(addendum)
      // split the string between the start and stop to extract the heading and licence
      const licence = addendum.substring(start.lastIndex, endMatch ? endMatch.index : undefined)
      // extract the markdown title for links
      const title = licence.match(/^\s*#+(.*)$/m)
      if (!title || !title[1]) {
        this.log(chalk.red(`Something went wrong loading the addendum from from ${THIRD_PARTY_ADDENDUM_FILE}.`))
        this.log(chalk.red('Could not find a title for the following licence. Did you format the file correctly?'))
        this.log(licence)
        this.error(new Error(`Could not determine title for licence in ${THIRD_PARTY_ADDENDUM_FILE}`))
      }
      const titleTrim = title[1].trim()
      // replace the title in licence with a normalized header amount
      const normalized = licence.replace(/^\s*#+(.*)$/m, `### ${titleTrim}`).trim()
      items.push({
        content: normalized,
        title: titleTrim,
      })
      // if there was no closing tag before the end of the file, break
      if (!endMatch)
        break
    }
    // return the information we gathered
    if (items.length > 0)
      return items
  }

  getDepFields(manifest) {
    const depFieldsToInclude = ['dependencies']
    if (manifest.includeDev) {
      depFieldsToInclude.push('devDependencies')
    }
    return depFieldsToInclude
  }

  async getManifest() {
    try {
      return fs.readJson(THIRD_PARTY_MANIFEST_FILE)
    } catch (e) {
      this.log(chalk.red(`Something went wrong loading config from ${THIRD_PARTY_MANIFEST_FILE}.`))
      this.error(e)
    }
  }

  async setManifest(manifest) {
    try {
      return fs.writeJSONSync(THIRD_PARTY_MANIFEST_FILE, manifest, {
        spaces: 2,
      })
    } catch (e) {
      this.log(chalk.red(`Something went wrong updating ${THIRD_PARTY_MANIFEST_FILE}`))
      this.error(e)
    }
  }

  async setNotices(notices) {
    try {
      fs.writeFileSync(THIRD_PARTY_NOTICES_FILE, notices)
    } catch (e) {
      this.log(chalk.red(`Something went wrong updating ${THIRD_PARTY_NOTICES_FILE}`))
      this.error(e)
    }
  }

  async getPkgJson() {
    try {
      return fs.readJson('package.json')
    } catch (e) {
      this.error('No package.json file found.')
    }
  }

  async getLicenseCheckerPackages() {
    return licenseCheckerInit({
      start: '.',
      unknown: true,
      summary: true,
      relativeLicensePath: true,
    })
  }

  async getThirdPartyAddendum() {
    try {
      const file = fs.readFileSync(THIRD_PARTY_ADDENDUM_FILE, 'utf8')
      this.log(`Found ${THIRD_PARTY_ADDENDUM_FILE} file`)
      return file
    } catch (e) {
      this.log(`No ${THIRD_PARTY_ADDENDUM_FILE} file found.`)
    }
  }

  mdTitleLink(title) {
    return `#${title.replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`
  }

  formatPkgJsonDeps(pkgJsonDeps = {}) {
    return Object.keys(pkgJsonDeps).reduce((pkgs, currentDep) => {
      pkgs[currentDep] = {
        name: currentDep,
        pkgJsonRange: pkgJsonDeps[currentDep],
      }
      return pkgs
    }, {})
  }
}

ThirdPartyCommand.description = `Generate third party notices
(1) Make sure you have run "npm install" before using this tool. It depends on node_modules.
(2) Run with "manifest" to update the manifest file (${THIRD_PARTY_MANIFEST_FILE}).
(3) Review the contents of ${THIRD_PARTY_MANIFEST_FILE} for accuracy and items marked "FOR_REVIEW" that require manual intervention.
(3a) Optionally add additional third party notices to a THIRD_PARTY_ADDENDUM.md file at the root of the project.
(4) Run with "notices" to update the notices file (${THIRD_PARTY_NOTICES_FILE}) using the manifest.
(5) Review the contents of ${THIRD_PARTY_NOTICES_FILE} for accuracy.
(6) Commit and deploy your changes.
(7) Yay open source!

WARNING: this tool does not currently handle monorepos.
`

ThirdPartyCommand.args = [{
  name: 'file',
  description: `What file do you want to update? Use "manifest" to update the ${THIRD_PARTY_MANIFEST_FILE} manifest of third party dependencies. Use "notices" to update the ${THIRD_PARTY_NOTICES_FILE} file using the content of the manifest.`,
  options: ['manifest', 'notices'],
  required: true,
}]

ThirdPartyCommand.flags = {
  forceUpdate: flags.boolean({
    description: 'Force update of manifest file.',
    default: false,
  }),
}

module.exports = ThirdPartyCommand
