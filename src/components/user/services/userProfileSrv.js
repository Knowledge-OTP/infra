'use strict';

angular.module('znk.infra.user').service('UserProfileService',
    function (InfraConfigSrv, StorageSrv, ENV, storageFirebaseAdapter, $q) {
        'ngInject';
        var profilePath = StorageSrv.variables.appUserSpacePath + '/profile';

        this.getProfile = function () {
            return InfraConfigSrv.getGlobalStorage().then(function(globalStorage) {
                return globalStorage.get(profilePath).then(function (profile) {
                    if (profile && (angular.isDefined(profile.email) || angular.isDefined(profile.nickname))) {
                        return profile;
                    }
                    return InfraConfigSrv.getUserData().then(function(authData) {
                        var emailFromAuth = authData.password ? authData.password.email : '';
                        var nickNameFromAuth = authData.auth ? authData.auth.name : emailFromAuth;

                        if (!profile.email) {
                            profile.email = emailFromAuth;
                        }
                        if (!profile.nickname) {
                            profile.nickname = nickNameFromAuth;
                        }
                        if (!profile.createdTime) {
                            profile.createdTime = StorageSrv.variables.currTimeStamp;
                        }

                        return globalStorage.set(profilePath, profile);
                    });
                });
            });
        };

        this.setProfile = function (newProfile) {
            return InfraConfigSrv.getGlobalStorage().then(function(globalStorage) {
                return globalStorage.set(profilePath, newProfile);
            });
        };

        this.getCurrUserId = function(){
            var fbAdapter = storageFirebaseAdapter(ENV.fbDataEndPoint + '/' + ENV.firebaseAppScopeName);//(igor) todo: requires better implementation
            var ref = fbAdapter.getRef('');
            var authData = ref.getAuth();
            return $q.when(authData && authData.uid);
        };
});
