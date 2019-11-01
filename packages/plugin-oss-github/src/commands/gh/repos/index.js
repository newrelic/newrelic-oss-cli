const {Command, flags} = require('@oclif/command')

// https://octokit.github.io/rest.js/
const Octokit = require('@octokit/rest')
const octokit = new Octokit()

class ReposCommand extends Command {
  async run() {
    const {flags} = this.parse(ReposCommand)
    // const name = flags.name || 'world'
    // this.log(`hello ${name} from ./src/commands/repos/list.js`)

    const baseUrl = 'https://github.com/'
    const org = flags.org || 'github'
    const orgUrl = baseUrl
    const type = flags.type || 'public'

    // Compare: https://developer.github.com/v3/repos/#list-organization-repositories
    const response = await octokit.repos.listForOrg({
      org,
      type,
    })

    let {data: repos} = response
    repos.forEach(r => {
      const message = orgUrl + r.full_name
      this.log(message)
    })
  }
}

ReposCommand.description = `Describe the command here
...
Extra documentation goes here
`

ReposCommand.flags = {
  org: flags.string({char: 'org', description: 'Organization'}),
}

module.exports = ReposCommand
