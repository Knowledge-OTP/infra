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
                var rootRef = new Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);

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
                    var userData = rootRef.getAuth();
                    var globalLastSessionRef = new Firebase(ENV.fbDataEndPoint + ENV.firebaseAppScopeName + '/lastSessions/' + userData.uid, ENV.firebaseAppScopeName);
                    return globalLastSessionRef.once('value').then(function(snapshot){
                        lastSessionData = snapshot.val();
                        if(!isLastSessionRecordDisabled){
                            globalLastSessionRef.child('began').set(Firebase.ServerValue.TIMESTAMP);
                            globalLastSessionRef.child('ended').set(null);
                            globalLastSessionRef.child('ended').onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
                        }
                    });
                }
                initProm = init();

                return UserSessionSrv;
            };
        }
    );
})(angular);
