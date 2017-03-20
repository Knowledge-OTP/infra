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

        function _getProfile() {
            var authData = AuthService.getAuth();
            if (!authData) {
                $log.error('UserProfileService.getProfile: Authenticate user not found');
                return $q.when(null);
            } else {
                var profilePath = 'users/' + authData.uid + '/profile';
                return UserStorageService.get(profilePath).then(function (profile) {
                    if (profile && (angular.isDefined(profile.email) || angular.isDefined(profile.nickname))) {
                        return profile;
                    } else {
                        return _extendProfileFromAuth(authData.uid, profile, authData);
                    }
                });
            }
        }

        function _getProfileByUserId(userId) {
            if (!userId) {
                $log.error('UserProfileService._getProfileByUserId: userId is undefined');
                return $q.when(null);
            } else {
                var userProfilePath = 'users/' + userId + '/profile';
                return UserStorageService.get(userProfilePath);
            }

        }

        function _extendProfileFromAuth(profile, authData) {
            var emailFromAuth = authData.auth ? authData.auth.email : authData.password ? authData.password.email : '';
            var nickNameFromAuth = authData.auth.name ? authData.auth.name : nickNameFromEmail(emailFromAuth);

            if (!profile.email) {
                profile.email = emailFromAuth;
            }
            if (!profile.nickname) {
                profile.nickname = nickNameFromAuth;
            }
            if (!profile.createdTime) {
                profile.createdTime = Firebase.ServerValue.TIMESTAMP;
            }

            _setProfile(profile, authData.uid);
            return profile;
        }

        function _createUserProfile(userId, email, nickname, provider) {
            var profile = {
                email: email,
                nickname: nickname,
                provider: provider,
                createdTime: Firebase.ServerValue.TIMESTAMP
            };

            _setProfile(profile, userId);
        }

        function _setProfile(newProfile, userId) {
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
        }

        function _getCurrUserId(){
            var authData = AuthService.getAuth();
            return $q.when(authData.uid);
        }

        function _updateUserTeachWorksId(uid, userTeachWorksId){
            var path = 'users/' + uid + '/teachworksId';
            return UserStorageService.get(path).then(function (teachWorksId) {
                return teachWorksId ? UserStorageService.update(path, userTeachWorksId) : UserStorageService.set(path, userTeachWorksId);
            });
        }

        function _getUserTeachWorksId(uid){
            var path = 'users/' + uid + '/teachworksId';
            return UserStorageService.get(path);
        }

        function _getUserName(uid){
            var path = 'users/' + uid + '/profile/nickname';
            return UserStorageService.get(path);
        }

        function nickNameFromEmail(email) {
            if (email){
                return email.split('@')[0];
            }
        }


        this.getProfile = _getProfile;
        this.getProfileByUserId = _getProfileByUserId;
        this.extendProfileFromAuth = _extendProfileFromAuth;
        this.createUserProfile = _createUserProfile;
        this.setProfile = _setProfile;
        this.getCurrUserId = _getCurrUserId;
        this.updateUserTeachWorksId = _updateUserTeachWorksId;
        this.getUserTeachWorksId = _getUserTeachWorksId;
        this.getUserName = _getUserName;
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
