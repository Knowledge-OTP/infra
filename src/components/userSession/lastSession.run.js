(function(angular, Firebase){
    'use strict';
    
    angular.module('znk.infra.userSession')
        .run(function(ENV, InfraConfigSrv){
            'ngInject';

            InfraConfigSrv.getUserData().then(function(userData){
                var globalLastSessionRef = new Firebase(ENV.fbDataEndPoint + ENV.firebaseAppScopeName + '/lastSessions/' + userData.uid, ENV.firebaseAppScopeName);
                globalLastSessionRef.child('began').set(Firebase.ServerValue.TIMESTAMP);
                globalLastSessionRef.child('ended').set(null);
                globalLastSessionRef.child('ended').onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
            });
        });
})(angular, Firebase);
