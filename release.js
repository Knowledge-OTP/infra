const simpleGit = require('simple-git')();

simpleGit.tags((err, tags) => {
    console.log("Latest available tag: %s", tags.latest);
    console.log('check out zinkerz');
    simpleGit.checkout('zinkerz/dev', (err, a) => {
        console.log('pull last changes');
        simpleGit.pull((err, a) => {
            const util = require('util')
            const exec = require('child_process').exec;
            console.log('start dist');
            const distPtom = new Promise((resolve, reject) => {
                const child = exec("grunt dist --gruntfile ./Gruntfile.js", function (error, stdout, stderr) {
                    // util.print('stdout: ' + stdout);
                    // util.print('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                        reject();
                        return
                    }
                    resolve();
                });
            });
            distPtom.then(() => {
                console.log('end dist');
                const nextTagParts = tags.latest.split('.');
                const lastIndex = nextTagParts.length - 1;
                const nextPatchVersion = +(nextTagParts[lastIndex]) + 1;
                nextTagParts[lastIndex] = nextPatchVersion;

                const newTag = nextTagParts.join('.');
                console.log(`new tag ${newTag}`);
                simpleGit.addTag(newTag,() => console.log('new tag was created'));
            },() => console.error('dist has failed'));
        })
    })
});
