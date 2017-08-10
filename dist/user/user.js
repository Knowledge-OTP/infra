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
    ["$log", "$q", "ENV", "AuthService", "UserStorageService", "InfraConfigSrv", function ($log, $q, ENV, AuthService, UserStorageService, InfraConfigSrv) {
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
                        return _extendProfileFromAuth(profile, authData);
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

            return _setProfile(profile, authData.uid).then(function () {
                return profile;
            }).catch(function (err) {
                $log.error('UserProfileService.extendProfileFromAuth: Error: ' + err);
            });

        }

        function _createUserProfile(userId, email, nickname, provider) {
            var profile = {
                email: email,
                nickname: nickname,
                provider: provider,
                createdTime: Firebase.ServerValue.TIMESTAMP
            };

            return _setProfile(profile, userId).then(function () {
                return profile;
            }).catch(function (err) {
                $log.error('UserProfileService.createUserProfile: Error: ' + err);
            });
        }

        function _setProfile(newProfile, userId) {
            var saveProfileProm = [];
            var authData = AuthService.getAuth();
            if (authData || userId){
                var uid = userId ? userId : authData.uid;
                var profilePath = 'users/' + uid + '/profile';
                return UserStorageService.get(profilePath).then(function (profile) {
                    if (ENV.setUserProfileTwice) {
                        saveProfileProm.push(_setUserProfileTwice(profilePath, newProfile));
                    }
                    if (profile){
                        saveProfileProm.push(UserStorageService.update(profilePath, newProfile));
                    } else {
                        saveProfileProm.push(UserStorageService.set(profilePath, newProfile));
                    }
                    return $q.all(saveProfileProm);
                });
            } else {
                $log.error('UserProfileService.setProfile: No user were found');
                return $q.when(null);
            }
        }

        function _setUserProfileTwice(profilePath, newProfile) {
            return InfraConfigSrv.getGlobalStorage().then(function(globalStorage) {
                return globalStorage.set(profilePath, newProfile);
            });
        }

        function _getCurrUserId(){
            var authData = AuthService.getAuth();
            return $q.when(authData.uid);
        }

        function _updateUserTeachWorksId(uid, userTeachWorksId){
            var saveProfileProm = [];
            var path = 'users/' + uid + '/teachworksId';
            return UserStorageService.get(path).then(function (teachWorksId) {
                if (ENV.setUserProfileTwice) {
                    saveProfileProm.push(_setUserProfileTwice(path, userTeachWorksId));
                }
                if (teachWorksId){
                    saveProfileProm.push(UserStorageService.update(path, userTeachWorksId));
                } else {
                    saveProfileProm.push(UserStorageService.set(path, userTeachWorksId));
                }
                return $q.all(saveProfileProm);
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
                    return InfraConfigSrv.getUserData().then(function () {
                        var globalLastSessionRef = initializeFireBase(); //(ENV.fbDataEndPoint + ENV.firebaseAppScopeName + '/lastSessions/' + userData.uid, ENV.firebaseAppScopeName);
                        return globalLastSessionRef.database().once('value').then(function(snapshot){
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

                function initializeFireBase(){
                    var config = {
                        apiKey: ENV.firebase_apiKey,
                        authDomain:  ENV.firebase_projectId + ".firebaseapp.com",
                        databaseURL: ENV.fbDataEndPoint,
                        storageBucket: ENV.firebase_projectId + ".appspot.com",
                        messagingSenderId: ENV.messagingSenderId
                    };
                    return window.firebase.initializeApp(config);
                }

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

angular.module('znk.infra.user').run(['$templateCache', function ($templateCache) {

}]);
