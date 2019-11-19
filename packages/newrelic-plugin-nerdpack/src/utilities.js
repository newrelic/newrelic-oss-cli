const os = require('os');
const dns = require('dns');

const resolveHome = function (filepath) {
  if (filepath[0] === '~') {
      return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

const isOnline = async function () {
  return new Promise((resolve, reject) => {
    dns.lookup("google.com", (err, address) => {
      if (err) {
        return reject(false);
      }
      return resolve(true);
    });
 });
};

module.exports = {
  resolveHome,
  isOnline
}