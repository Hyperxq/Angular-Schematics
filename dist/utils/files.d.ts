import { Rule } from '@angular-devkit/schematics';

declare function addFilesToTree(options: {
    [key: string]: any;
}, urlToMove: string, urlTemplates: string[], urlFiles?: string): Rule;

export { addFilesToTree };
