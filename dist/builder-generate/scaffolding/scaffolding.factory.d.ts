import { Rule } from '@angular-devkit/schematics';

declare function scaffoldingFactory({ root }: {
    root: string;
}): Rule;

export { scaffoldingFactory };
