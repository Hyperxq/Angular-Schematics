import { Rule } from '@angular-devkit/schematics';

declare function jasmineToJestFactory({ packageManager, }: {
    packageManager: string;
}): Rule;

export { jasmineToJestFactory };
