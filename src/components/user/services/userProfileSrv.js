'use strict';

angular.module('znk.infra.user').service('UserProfileService',
    function (InfraConfigSrv, StorageSrv) {
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
            return InfraConfigSrv.getGlobalStorage().then(function(GlobalStorage){
                var ref = GlobalStorage.adapter.getRef('');
                var authData = ref.getAuth();
                return authData && authData.uid;
            });
        };

        this.updateUserTeachWorksId = function(uid, userTeachWorksId){
            return InfraConfigSrv.getGlobalStorage().then(function(GlobalStorage){
                var path = 'users/' + uid + '/teachworksId';
                return GlobalStorage.update(path, userTeachWorksId);
            });
        };

        this.getUserTeachWorksId = function(uid){
            return InfraConfigSrv.getGlobalStorage().then(function(GlobalStorage){
                var path = 'users/' + uid + '/teachworksId';
                return GlobalStorage.get(path);
            });
        };
});
