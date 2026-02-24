const CIPHER_ASCII = String.raw`
 ██████╗██╗██████╗ ██╗  ██╗███████╗██████╗
██╔════╝██║██╔══██╗██║  ██║██╔════╝██╔══██╗
██║     ██║██████╔╝███████║█████╗  ██████╔╝
██║     ██║██╔═══╝ ██╔══██║██╔══╝  ██╔══██╗
╚██████╗██║██║     ██║  ██║███████╗██║  ██║
 ╚═════╝╚═╝╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
`;

function shouldPrintBanner(argv = [], env = process.env) {
  if (String(env.CIPHER_NO_BANNER || '') === '1') return false;
  return !argv.includes('--quiet');
}

function printBanner(options = {}) {
  const {
    stream = process.stdout,
    prefix = '\n',
    suffix = '\n',
  } = options;
  stream.write(`${prefix}${CIPHER_ASCII}${suffix}`);
}

module.exports = {
  CIPHER_ASCII,
  shouldPrintBanner,
  printBanner,
};
