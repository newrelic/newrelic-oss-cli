/* eslint-disable camelcase */
const {Command, flags} = require('@oclif/command')

// https://octokit.github.io/rest.js/
const Octokit = require('@octokit/rest')
const octokit = new Octokit()

class IssuesCommand extends Command {
  async run() {
    const {flags} = this.parse(IssuesCommand)
    // const name = flags.name || 'world'
    // this.log(`hello ${name} from ./src/commands/repos/list.js`)

    const baseUrl = 'https://github.com/'
    const org = flags.org || 'github'
    const orgUrl = baseUrl + org + '/'
    const type = flags.type || 'all'
    const sort = flags.sort || 'created'
    const direction = flags.direction || 'desc'

    // Compare: https://developer.github.com/v3/repos/#list-organization-repositories
    const response = await octokit.repos.listForOrg({
      org,
      type,
      sort,
      direction,
    })

    let {data: repos} = response

    const open_issues = flags.open_issues || true
    if (open_issues) {
      repos = repos.filter(r => r.open_issues > 0)
    }

    const formattedRepos = repos.map(r => {
      return {full_name: r.full_name, open_issues: r.open_issues}
    })

    formattedRepos.sort((a, b) => b.open_issues - a.open_issues)
    formattedRepos.forEach(r => {
      const message = baseUrl + r.full_name + '/issues' + ' has ' + r.open_issues + ' open issues '
      this.log(message)
    })

    // this.log(formattedRepos)
  }
}

IssuesCommand.description = `List Github repositories associated with this organization
...
Extra documentation goes here
`

IssuesCommand.flags = {
  open_issues: flags.string({char: 'open_issues', description: 'Filter results to those with open issues'}),
  org: flags.string({char: 'org', description: 'Organization'}),
  sort: flags.string({char: 'sort', description: 'Sort by field'}),
  direction: flags.string({char: 'direction', description: 'Sort by order'}),
}

module.exports = IssuesCommand
