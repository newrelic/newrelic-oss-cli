const {Command, flags} = require('@oclif/command')

// https://octokit.github.io/rest.js/
const Octokit = require('@octokit/rest')
const octokit = new Octokit()

class ListContributorsCommand extends Command {
  async run() {
    const {flags} = this.parse(ListContributorsCommand)
    const owner = flags.owner || 'github'
    const repo = flags.repo || false

    if (!repo) {
      // this.log('Please include a repo')
      throw new Error('Please include a repo arg')
    }

    this.log('Fetching contributors for: ' + owner + '/' + repo)
    const contribResponse = await octokit.repos.listContributors({
      owner: owner,
      repo: repo,
    })

    this.log('Contributors :' + JSON.stringify(contribResponse, null, 2))
  }
}

ListContributorsCommand.description = `Describe the command here
...
Extra documentation goes here
`

ListContributorsCommand.flags = {
  owner: flags.string({char: 'o', description: 'name to print'}),
  repo: flags.string({char: 'r', description: 'name to print'}),
}

module.exports = ListContributorsCommand
