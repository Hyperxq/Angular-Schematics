declare const installCommands: {
    npm: string;
    yarn: string;
    pnpm: string;
    cnpm: string;
    bun: string;
};
declare const installAsDevCommands: {
    npm: string;
    yarn: string;
    pnpm: string;
    cnpm: string;
    bun: string;
};
declare const uninstallCommands: {
    npm: string;
    yarn: string;
    pnpm: string;
    cnpm: string;
    bun: string;
};

export { installAsDevCommands, installCommands, uninstallCommands };
