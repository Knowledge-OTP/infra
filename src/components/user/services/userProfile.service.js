'use strict';

angular.module('znk.infra.user').service('UserProfileService',
    function ($log, $q, ENV, AuthService, UserStorageService) {
        'ngInject';

        function _getProfile() {
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
                        return _extendProfileFromAuth(authData.uid, profile, authData);
                    }
                });
            }
        }

        function _getProfileByUserId(userId) {
            var userProfilePath = 'users/' + userId + '/profile';
            return UserStorageService.get(userProfilePath);
        }

        function _extendProfileFromAuth(userId, profile, authData) {
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

            _setProfile(profile, userId);
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
    });
