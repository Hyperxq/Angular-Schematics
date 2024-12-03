type ExistingPathBehavior = 'update' | 'skip' | 'merge';
declare function addShortImportToTsConfig(tsconfigContent: string, pathAlias: string, pathValue: string, behavior?: ExistingPathBehavior): string;

export { addShortImportToTsConfig };
