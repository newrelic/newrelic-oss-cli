const {Command, flags} = require('@oclif/command')

const chalk = require('chalk')
const fs = require('fs-extra')

const os = require('os');
const path = require('path');

class ValidateCommand extends Command {
  async run() {
    const {flags} = this.parse(ValidateCommand)

    const defaultFlags = {
      directory: os.homedir()
    }

    const { directory } = Object.assign({}, flags, defaultFlags)

    // TO DO
    // If first character in -d is ~ (for mac), translate into home directory
    const currentDirectory = path.join(directory, 'Desktop/NewRelic/github.newrelic/nr1-top')
    
    const nerdpackSchema = {
      files: [
        'THIRD_PARTY_NOTICES.md',
        'cla.md'
      ]
    }
    
    this.log(chalk.yellow("Examining: " + currentDirectory));

    nerdpackSchema.files.forEach((fileName) => {
      
      const fileExists = fs.existsSync(path.join(currentDirectory, fileName));
      
      if (fileExists) {
        this.log(chalk.green("Found: ") + fileName);
      }

      if (!fileExists) {
        this.log(chalk.red("Missing: " + fileName));
      }

    })

  }
}

ValidateCommand.description = `Validate the contents of an Open Source Nerdpack
...
Extra documentation goes here
`

ValidateCommand.flags = {
  directory: flags.string({char: 'd', description: 'directory to check'}),
}

module.exports = ValidateCommand
