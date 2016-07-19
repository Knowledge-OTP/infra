(function () {
    angular.module('demo').run(function(ENV){
        // default options
        var options = {
            email: 'tester@zinkerz.com',
            password: 111111,
            authDbPath: 'https://znk-dev.firebaseio.com/',
            dataDbPath: 'https://sat-dev.firebaseio.com/',
            dataAuthToken: 'TykqAPXV4zlTTG0v6UuOt4OF3HssDykhJd90dAIc',
            studentPath: '/sat_app'
        };

        var keysObj = {
            email: 'znkUser',
            password: 'znkPwd',
            authDbPath: 'znkAuth',
            dataDbPath: 'znkData',
            dataAuthToken: 'znkAuthToken',
            studentPath: 'znkStudentPath'
        };

        angular.forEach(keysObj, function (keyValue, keyName) {
            var localData = localStorage.getItem(keyValue);
            if (localData) {
                options[keyName] = localData;
            }
        });


        var authRef = new Firebase(options.authDbPath, ENV.firebaseAppScopeName);

        authProm = authRef.authWithPassword({
            email: options.email,
            password: '' + options.password
        }).then(function (res) {
            console.log('auth success', res);
            return res;
        }).catch(function (err) {
            console.error(err);
        });
        var dataRef = new Firebase(options.dataDbPath, ENV.firebaseAppScopeName);
        dataRef.authWithCustomToken(options.dataAuthToken);
    });
})();
