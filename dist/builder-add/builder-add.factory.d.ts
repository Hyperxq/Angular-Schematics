import { Rule } from '@angular-devkit/schematics';

declare function builderAddFactory(): Rule;
declare function addCliConfig(): Rule;

export { addCliConfig, builderAddFactory };
