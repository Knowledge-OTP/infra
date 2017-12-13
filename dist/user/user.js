(function (angular) {
    'use strict';

    angular.module('znk.infra.user', [
        'znk.infra.config',
        'znk.infra.storage',
        'znk.infra.auth'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.user').service('UserProfileService',
        ["$log", "$q", "ENV", "AuthService", "UserStorageService", "InfraConfigSrv", function ($log, $q, ENV, AuthService, UserStorageService, InfraConfigSrv) {
            'ngInject';

            function _getProfile() {
                return new Promise(function (resolve) {
                    AuthService.getAuth().then(authData => {
                        if (!authData) {
                            $log.error('UserProfileService.getProfile: Authenticate user not found');
                            resolve(null);
                        } else {
                            var profilePath = 'users/' + authData.uid + '/profile';
                            UserStorageService.get(profilePath).then(function (profile) {
                                if (profile && (angular.isDefined(profile.email) || angular.isDefined(profile.nickname))) {
                                    resolve(profile);
                                } else {
                                    resolve(_extendProfileFromAuth(profile, authData));
                                }
                            });
                        }
                    });
                });
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
                var emailFromAuth = authData.email || '';
                var nickNameFromAuth = authData.displayName || nickNameFromEmail(emailFromAuth);

                if (!profile.email) {
                    profile.email = emailFromAuth;
                }
                if (!profile.nickname) {
                    profile.nickname = nickNameFromAuth;
                }
                if (!profile.createdTime) {
                    profile.createdTime = window.firebase.database.ServerValue.TIMESTAMP;
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
                    createdTime: window.firebase.database.ServerValue.TIMESTAMP
                };

                return _setProfile(profile, userId).then(function () {
                    return profile;
                }).catch(function (err) {
                    $log.error('UserProfileService.createUserProfile: Error: ' + err);
                });
            }

            function _setProfile(newProfile, userId) {
                var saveProfileProm = [];
                return AuthService.getAuth().then(authData => {
                    if (authData || userId) {
                        var uid = userId ? userId : authData.uid;
                        var profilePath = 'users/' + uid + '/profile';
                        return UserStorageService.get(profilePath).then(function (profile) {
                            if (ENV.setUserProfileTwice) {
                                saveProfileProm.push(_setUserProfileTwice(profilePath, newProfile));
                            }
                            if (profile) {
                                saveProfileProm.push(UserStorageService.update(profilePath, newProfile));
                            } else {
                                saveProfileProm.push(UserStorageService.set(profilePath, newProfile));
                            }
                            return $q.all(saveProfileProm);
                        });
                    } else {
                        $log.error('UserProfileService.setProfile: No user were found');
                        return null;
                    }
                });
            }

            function _setUserProfileTwice(profilePath, newProfile) {
                return InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                    return globalStorage.set(profilePath, newProfile);
                });
            }

            function _getCurrUserId() {
                return AuthService.getAuth().then(authData => {
                    return authData.uid;
                });
            }

            function _updateUserTeachWorksId(uid, userTeachWorksId) {
                var saveProfileProm = [];
                var path = 'users/' + uid + '/teachworksId';
                return UserStorageService.get(path).then(function (teachWorksId) {
                    if (ENV.setUserProfileTwice) {
                        saveProfileProm.push(_setUserProfileTwice(path, userTeachWorksId));
                    }
                    if (teachWorksId) {
                        saveProfileProm.push(UserStorageService.update(path, userTeachWorksId));
                    } else {
                        saveProfileProm.push(UserStorageService.set(path, userTeachWorksId));
                    }
                    return $q.all(saveProfileProm);
                });
            }

            function _getUserTeachWorksId(uid) {
                var path = 'users/' + uid + '/teachworksId';
                return UserStorageService.get(path);
            }

            function _getUserName(uid) {
                var path = 'users/' + uid + '/profile/nickname';
                return UserStorageService.get(path);
            }

            function nickNameFromEmail(email) {
                if (email) {
                    return email.split('@')[0];
                }
            }

            function darkFeaturesValid(userIdArr) {
                let isValid = true;
                let profilePromArr = [];
                userIdArr.forEach(userId => profilePromArr.push(_getProfileByUserId(userId)));
                return $q.all(profilePromArr)
                    .then(profilesArr => {
                        profilesArr.forEach(profile => {
                            if (!profile || !profile.darkFeatures || !(profile.darkFeatures.myzinkerz || profile.darkFeatures.all)) {
                                isValid = false;
                            }
                        });
                        return isValid;
                    });
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
            this.darkFeaturesValid = darkFeaturesValid;
        }]);

})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.user').provider('UserSessionSrv',
        function () {
            'ngInject';

            var isLastSessionRecordDisabled = false;
            this.disableLastSessionRecord = function (isDisbaled) {
                isLastSessionRecordDisabled = !!isDisbaled;
            };

            this.$get = ["InfraConfigSrv", "ENV", "$window", function (InfraConfigSrv, ENV, $window) {
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
            }];
        }
    );
})(angular);

'use strict';

angular.module('znk.infra.user').service('UserStorageService',
["StorageFirebaseAdapter", "ENV", "StorageSrv", "AuthService", function (StorageFirebaseAdapter, ENV, StorageSrv, AuthService) {
    'ngInject';
    // authFirebaseRequired - Indicates we want to instantiate an instance of the AuthFirebaseDB.
    var authFirebaseRequired = true;
    var fbAdapter = new StorageFirebaseAdapter(ENV.fbGlobalEndPoint, authFirebaseRequired);
    var config = {
        variables: {
            uid: function () {
                return AuthService.getAuth().then(user => {
                    return user.uid;
                });
            }
        }
    };

    return new StorageSrv(fbAdapter, config);
}]);

angular.module('znk.infra.user').run(['$templateCache', function ($templateCache) {

}]);
