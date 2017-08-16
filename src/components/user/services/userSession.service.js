(function (angular) {
    'use strict';

    angular.module('znk.infra.user').provider('UserSessionSrv',
        function () {
            'ngInject';

            var isLastSessionRecordDisabled = false;
            this.disableLastSessionRecord = function (isDisbaled) {
                isLastSessionRecordDisabled = !!isDisbaled;
            };

            this.$get = function (InfraConfigSrv, ENV) {
                'ngInject';// jshint ignore:line

                var initProm,lastSessionData;

                var UserSessionSrv = {};

                UserSessionSrv.isLastSessionRecordDisabled = function () {
                    return isLastSessionRecordDisabled;
                };

                UserSessionSrv.getLastSessionData = function () {
                    return initProm.then(function(){
                        return lastSessionData;
                    });
                };

                function init() {
                    return InfraConfigSrv.getUserData().then(function (userData) {
                        var globalLastSessionRef = initializeFireBase(); //(ENV.fbDataEndPoint + ENV.firebaseAppScopeName + '/lastSessions/' + userData.uid, ENV.firebaseAppScopeName);
                        var lastSessionPath = ENV.firebaseAppScopeName + '/lastSessions/' + userData.uid;
                        return globalLastSessionRef.database().ref(lastSessionPath).once('value').then(function(snapshot){
                            lastSessionData = snapshot.exportVal();
                            if(!isLastSessionRecordDisabled){
                                globalLastSessionRef.database().ref('began').set(window.firebase.database.ServerValue.TIMESTAMP);
                                globalLastSessionRef.database().ref('ended').set(null);
                                globalLastSessionRef.database().ref('ended').onDisconnect().set(window.firebase.database.ServerValue.TIMESTAMP);
                            }
                        });
                    });
                }
                initProm = init();

                function initializeFireBase(){
                    var appName = ENV.firebase_projectId;
                    var existApp;

                    window.firebase.apps.forEach(function (app) {
                        if (app.name.toLowerCase() === appName.toLowerCase()) {
                            existApp = app;
                        }
                    });
                    if (!existApp) {
                        var config = {
                            apiKey: ENV.firebase_apiKey,
                            authDomain:  ENV.firebase_projectId + ".firebaseapp.com",
                            databaseURL: ENV.fbDataEndPoint,
                            projectId: ENV.firebase_projectId,
                            storageBucket: ENV.firebase_projectId + ".appspot.com",
                            messagingSenderId: ENV.messagingSenderId
                        };
                        existApp =  window.firebase.initializeApp(config, appName);
                    }
                    return existApp;
                }

                return UserSessionSrv;
            };
        }
    );
})(angular);
