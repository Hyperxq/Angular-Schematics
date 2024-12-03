'use strict';

const installCommands = {
    npm: 'install',
    yarn: 'add',
    pnpm: 'add',
    cnpm: 'install',
    bun: 'add'
};
const installAsDevCommands = {
    npm: 'install --save-dev',
    yarn: 'add --dev',
    pnpm: 'add --dev',
    cnpm: 'install --save-dev',
    bun: 'add --dev'
};
const uninstallCommands = {
    npm: 'uninstall',
    yarn: 'remove',
    pnpm: 'remove',
    cnpm: 'uninstall',
    bun: 'remove'
};

exports.installAsDevCommands = installAsDevCommands;
exports.installCommands = installCommands;
exports.uninstallCommands = uninstallCommands;
