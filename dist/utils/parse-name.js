'use strict';

var core = require('@angular-devkit/core');

function parseName(name, path = './') {
    const nameWithoutPath = core.basename(core.normalize(name));
    const namePath = core.dirname(core.join(core.normalize(path), name));
    return {
        name: nameWithoutPath,
        path: core.normalize('/' + namePath)
    };
}

exports.parseName = parseName;
