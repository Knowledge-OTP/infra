'use strict';

angular.module('znk.infra.user').service('UserProfileService',
    function ($q, ENV, AuthService, UserStorageService) {
        'ngInject';

        var _this = this;

        this.getProfile = function () {
            var authData = AuthService.getAuth();
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
        };

        this.getProfileByUserId = function (userId) {
            var userProfilePath = 'users/' + userId + '/profile';
            return UserStorageService.get(userProfilePath);
        };

        this.setProfile = function (newProfile) {
            var authData = AuthService.getAuth();
            var profilePath = 'users/' + authData.uid + '/profile';
            return UserStorageService.get(profilePath).then(function (profile) {
                return profile ? UserStorageService.update(profilePath, newProfile) : UserStorageService.set(profilePath, newProfile);
            });

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
});
