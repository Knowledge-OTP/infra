(function (angular) {
    'use strict';

    angular.module('znk.infra.user', [
        'znk.infra.config',
        'znk.infra.storage',
        'znk.infra.auth'
    ]);
})(angular);

'use strict';

angular.module('znk.infra.user').service('UserProfileService',
    ["$q", "ENV", "AuthService", function ($q, ENV, AuthService) {
        'ngInject';

        var _this = this;
        var refAuthDB = new Firebase(ENV.fbGlobalEndPoint);

        this.getProfile = function () {
            var authData = AuthService.getAuth();
            var profilePath = 'users/' + authData.uid + '/profile';
            return refAuthDB.child(profilePath).once('value').then(function (snapshot) {
                var profile = snapshot.val();
                if (profile && (angular.isDefined(profile.email) || angular.isDefined(profile.nickname))) {
                    return profile;
                } else {
                    var emailFromAuth = authData.auth ? authData.auth.email : authData.password ? authData.password.email : '';
                    var nickNameFromAuth = authData.auth.name ? authData.auth.name : nickNameFromEmail(emailFromAuth);

                    if (!profile) {
                        profile = {
                            email: emailFromAuth,
                            nickname: nickNameFromAuth,
                            createdTime: Firebase.ServerValue.TIMESTAMP
                        };
                    }
                    if (!profile.email) {
                        profile.email = emailFromAuth;
                    }
                    if (!profile.nickname) {
                        profile.nickname = nickNameFromAuth;
                    }
                    if (!profile.createdTime) {
                        profile.createdTime = Firebase.ServerValue.TIMESTAMP;
                    }

                    _this.setProfile(profile);
                    return profile;
                }
            });
        };

        this.getProfileByUserId = function (userId) {
            var userProfilePath = 'users/' + userId + '/profile';
            return refAuthDB.child(userProfilePath).once('value').then(function (snapshot) {
                return snapshot.val();
            });
        };

        this.setProfile = function (newProfile) {
            var authData = AuthService.getAuth();
            var profilePath = 'users/' + authData.uid + '/profile';
            return refAuthDB.child(profilePath).once('value').then(function (snapshot) {
                var profile = snapshot.val();
                return profile ? refAuthDB.child(profilePath).update(newProfile) : refAuthDB.child(profilePath).set(newProfile);
            });

        };

        this.getCurrUserId = function(){
            var authData = AuthService.getAuth();
            return $q.when(authData.uid);
        };

        this.updateUserTeachWorksId = function(uid, userTeachWorksId){
            var path = 'users/' + uid + '/teachworksId';
            return refAuthDB.child(path).once('value').then(function (snapshot) {
                var teachWorksId = snapshot.val();
                return teachWorksId ? refAuthDB.child(path).update(userTeachWorksId) : refAuthDB.child(path).set(userTeachWorksId);
            });
        };

        this.getUserTeachWorksId = function(uid){
            var path = 'users/' + uid + '/teachworksId';
            return refAuthDB.child(path).once('value').then(function (snapshot) {
                return snapshot.val();
            });
        };

        this.getUserName = function(uid){
            var path = 'users/' + uid + '/profile/nickname';
            return refAuthDB.child(path).once('value').then(function (snapshot) {
                return snapshot.val();
            });
        };

        function nickNameFromEmail(email) {
            if (email){
                return email.split('@')[0];
            }
        }
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.user').provider('UserSessionSrv',
        function () {
            'ngInject';

            var isLastSessionRecordDisabled = false;
            this.disableLastSessionRecord = function (isDisbaled) {
                isLastSessionRecordDisabled = !!isDisbaled;
            };

            this.$get = ["InfraConfigSrv", "ENV", function (InfraConfigSrv, ENV) {
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
            }];
        }
    );
})(angular);

angular.module('znk.infra.user').run(['$templateCache', function($templateCache) {

}]);
