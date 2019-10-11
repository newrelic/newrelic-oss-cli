const {Command, flags} = require('@oclif/command')

// https://octokit.github.io/rest.js/
// https://github.com/octokit/graphql.js

const Octokit = require('@octokit/rest')
const octokit = new Octokit()

class ReposCommand extends Command {
  async run() {
    const {flags} = this.parse(ReposCommand)
    const name = flags.name || 'world'
    this.log(`hello ${name} from ./src/commands/repos/index.js`)
  }
}

ReposCommand.description = `Describe the command here
...
Extra documentation goes here
`

ReposCommand.flags = {
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = ReposCommand
