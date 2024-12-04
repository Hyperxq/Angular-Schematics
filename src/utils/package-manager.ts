export const installCommands = {
  npm: 'install',
  yarn: 'add',
  pnpm: 'add',
  cnpm: 'install',
  bun: 'add',
};

export const installAsDevCommands = {
  npm: 'install --save-dev',
  yarn: 'add --dev',
  pnpm: 'add --dev',
  cnpm: 'install --save-dev',
  bun: 'add --dev',
};

export const uninstallCommands = {
  npm: 'uninstall',
  yarn: 'remove',
  pnpm: 'remove',
  cnpm: 'uninstall',
  bun: 'remove',
};

export const executePackageCommand = {
  npm: 'npx',
  yarn: 'yarn dlx',
  pnpm: 'pnpm dlx',
  cnpm: 'cnpx',
  bun: 'bun x',
};

export const lockFile = { npm: 'package-lock.json', yarn: 'yarn.lock', pnpm: 'pnpm-lock.yaml', cnpm: 'pnpm-lock.yaml', bun: 'bun.lockb' };
