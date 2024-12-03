'use strict';

var pluralize = require('pluralize');
var schematics = require('@angular-devkit/schematics');

function addFilesToTree(options, urlToMove, urlTemplates, urlFiles = './files/ts') {
    const template = schematics.apply(schematics.url(urlFiles), [
        schematics.filter((path)=>urlTemplates.some((template)=>path.endsWith(template))),
        schematics.applyTemplates({
            ...schematics.strings,
            ...options,
            singular: pluralize.singular,
            plural: pluralize.plural,
            lowercased: (name)=>{
                const classifiedName = schematics.strings.classify(name);
                return classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1);
            },
            ent: (name)=>name + '.entity'
        }),
        schematics.renameTemplateFiles(),
        schematics.move(urlToMove)
    ]);
    return schematics.mergeWith(template, schematics.MergeStrategy.AllowCreationConflict);
}

exports.addFilesToTree = addFilesToTree;
