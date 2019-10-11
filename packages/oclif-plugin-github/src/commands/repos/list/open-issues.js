/* eslint-disable camelcase */
const {Command, flags} = require('@oclif/command')

// https://octokit.github.io/rest.js/
const Octokit = require('@octokit/rest')
const octokit = new Octokit()

class OpenIssuesCommand extends Command {
  async run() {
    const {flags} = this.parse(OpenIssuesCommand)
    // const name = flags.name || 'world'
    // this.log(`hello ${name} from ./src/commands/repos/list.js`)

    const baseUrl = 'https://github.com/'
    const org = flags.org || 'github'
    const orgUrl = baseUrl + org + '/'
    const type = flags.type || 'public'

    // Compare: https://developer.github.com/v3/repos/#list-organization-repositories
    const response = await octokit.repos.listForOrg({
      org,
      type,
    })

    let {data: repos} = response
    repos = repos.filter(r => r.open_issues > 0)

    const formattedRepos = repos.map(r => {
      return {full_name: r.full_name, open_issues: r.open_issues}
    })

    formattedRepos.sort((a, b) => b.open_issues - a.open_issues)
    formattedRepos.forEach(r => {
      const message = orgUrl + r.full_name + ' has ' + r.open_issues + ' open issues '
      this.log(message)
    })

    // this.log(formattedRepos)
  }
}

OpenIssuesCommand.description = `List Github repositories associated with this organization
...
Extra documentation goes here
`

OpenIssuesCommand.flags = {
  open_issues: flags.string({char: 'open_issues', description: 'Filter results to those with open issues'}),
  org: flags.string({char: 'org', description: 'Organization'}),
}

module.exports = OpenIssuesCommand
