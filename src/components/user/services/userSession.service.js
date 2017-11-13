(function (angular) {
    'use strict';

    angular.module('znk.infra.user').provider('UserSessionSrv',
        function () {
            'ngInject';

            var isLastSessionRecordDisabled = false;
            this.disableLastSessionRecord = function (isDisbaled) {
                isLastSessionRecordDisabled = !!isDisbaled;
            };

            this.$get = function (InfraConfigSrv, ENV, $window) {
                'ngInject';// jshint ignore:line

                var initProm, lastSessionData;

                var UserSessionSrv = {};

                UserSessionSrv.isLastSessionRecordDisabled = function () {
                    return isLastSessionRecordDisabled;
                };

                UserSessionSrv.getLastSessionData = function () {
                    return initProm.then(function () {
                        return lastSessionData;
                    });
                };

                function init() {
                    return InfraConfigSrv.getUserData().then(function (userData) {
                        if (userData && userData.uid) {
                            var dbRef = initializeFireBase();
                            var db = dbRef.database();
                            var lastSessionPath = ENV.firebaseAppScopeName + '/lastSessions/' + userData.uid;
                            var lastSessionRef = db.ref(lastSessionPath);
                            return lastSessionRef.once('value').then(snapshot => {
                                lastSessionData = snapshot.val();
                                if (!isLastSessionRecordDisabled) {
                                    lastSessionRef.child('began').set($window.firebase.database.ServerValue.TIMESTAMP);
                                    lastSessionRef.child('ended').set(null);
                                    lastSessionRef.child('ended').onDisconnect().set($window.firebase.database.ServerValue.TIMESTAMP);

                                    var sessionRef = db.ref(ENV.firebaseAppScopeName + '/sessions/' + userData.uid);
                                    var newSessionKey = db.ref().push().key;
                                    sessionRef.child(newSessionKey).child('began').set($window.firebase.database.ServerValue.TIMESTAMP);
                                    sessionRef.child(newSessionKey).child('ended').set(null);
                                    sessionRef.child(newSessionKey).child('ended').onDisconnect().set($window.firebase.database.ServerValue.TIMESTAMP);

                                    var userSessionRef = db.ref(ENV.firebaseAppScopeName + '/users/' + userData.uid + '/lastSession');
                                    userSessionRef.child('ended').onDisconnect().set($window.firebase.database.ServerValue.TIMESTAMP);
                                }
                            });
                        }
                    });
                }
                initProm = init();

                function initializeFireBase(authFirebaseRequired) {
                    var appName = authFirebaseRequired ? ENV.authAppName : ENV.firebaseAppScopeName;
                    var existApp;

                    $window.firebase.apps.forEach(function (app) {
                        if (app.name.toLowerCase() === appName.toLowerCase()) {
                            existApp = app;
                        }
                    });
                    if (!existApp) {
                        var config;
                        if (authFirebaseRequired) {
                            config = {
                                apiKey: ENV.firbase_auth_config.apiKey,
                                authDomain: ENV.firbase_auth_config.projectId + ".firebaseapp.com",
                                databaseURL: ENV.firbase_auth_config.databaseURL,
                                projectId: ENV.firbase_auth_config.projectId,
                                storageBucket: ENV.firbase_auth_config.projectId + ".appspot.com",
                                messagingSenderId: ENV.firbase_auth_config.messagingSenderId
                            };
                        } else {
                            config = {
                                apiKey: ENV.firebase_apiKey,
                                authDomain: ENV.firebase_projectId + ".firebaseapp.com",
                                databaseURL: ENV.fbDataEndPoint,
                                projectId: ENV.firebase_projectId,
                                storageBucket: ENV.firebase_projectId + ".appspot.com",
                                messagingSenderId: ENV.messagingSenderId
                            };
                        }
                        existApp = $window.firebase.initializeApp(config, appName);
                    }
                    return existApp;
                }

                return UserSessionSrv;
            };
        }
    );
})(angular);
