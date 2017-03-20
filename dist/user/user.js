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
    ["$log", "$q", "ENV", "AuthService", "UserStorageService", function ($log, $q, ENV, AuthService, UserStorageService) {
        'ngInject';

        var _this = this;

        this.getProfile = function () {
            var authData = AuthService.getAuth();
            if (!authData) {
                $log.debug('UserProfileService.getProfile: Authenticate user not found');
                return $q.when(null);
            } else {
                var profilePath = 'users/' + authData.uid + '/profile';
                return UserStorageService.get(profilePath).then(function (profile) {
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
            }
        };

        this.getProfileByUserId = function (userId) {
            var userProfilePath = 'users/' + userId + '/profile';
            return UserStorageService.get(userProfilePath);
        };

        this.setProfile = function (newProfile, userId) {
            var authData = AuthService.getAuth();
            if (authData || userId){
                var uid = userId ? userId : authData.uid;
                var profilePath = 'users/' + uid + '/profile';
                return UserStorageService.get(profilePath).then(function (profile) {
                    return profile ? UserStorageService.update(profilePath, newProfile) : UserStorageService.set(profilePath, newProfile);
                });
            } else {
                $log.error('UserProfileService.setProfile: No user were found');
                return $q.when(null);
            }
        };

        this.getCurrUserId = function(){
            var authData = AuthService.getAuth();
            return $q.when(authData.uid);
        };

        this.updateUserTeachWorksId = function(uid, userTeachWorksId){
            var path = 'users/' + uid + '/teachworksId';
            return UserStorageService.get(path).then(function (teachWorksId) {
                return teachWorksId ? UserStorageService.update(path, userTeachWorksId) : UserStorageService.set(path, userTeachWorksId);
            });
        };

        this.getUserTeachWorksId = function(uid){
            var path = 'users/' + uid + '/teachworksId';
            return UserStorageService.get(path);
        };

        this.getUserName = function(uid){
            var path = 'users/' + uid + '/profile/nickname';
            return UserStorageService.get(path);
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
                        var globalLastSessionRef = new Firebase(ENV.fbDataEndPoint + ENV.firebaseAppScopeName + '/lastSessions/' + userData.uid, ENV.firebaseAppScopeName);
                        return globalLastSessionRef.once('value').then(function(snapshot){
                            lastSessionData = snapshot.val();
                            if(!isLastSessionRecordDisabled){
                                globalLastSessionRef.child('began').set(Firebase.ServerValue.TIMESTAMP);
                                globalLastSessionRef.child('ended').set(null);
                                globalLastSessionRef.child('ended').onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
                            }
                        });
                    });
                }
                initProm = init();

                return UserSessionSrv;
            }];
        }
    );
})(angular);

'use strict';

angular.module('znk.infra.user').service('UserStorageService',
    ["StorageFirebaseAdapter", "ENV", "StorageSrv", "AuthService", function (StorageFirebaseAdapter, ENV, StorageSrv, AuthService) {
        'ngInject';

        var fbAdapter = new StorageFirebaseAdapter(ENV.fbGlobalEndPoint);
        var config = {
            variables: {
                uid: function uid() {
                    return AuthService.getAuth() && AuthService.getAuth().uid;
                }
            }
        };

        return new StorageSrv(fbAdapter, config);
    }]);

angular.module('znk.infra.user').run(['$templateCache', function($templateCache) {

}]);
