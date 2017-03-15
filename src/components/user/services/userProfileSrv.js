'use strict';

angular.module('znk.infra.user').service('UserProfileService',
    function ($q, ENV) {
        'ngInject';

        var rootRef = new Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);
        var refAuthDB = new Firebase(ENV.fbGlobalEndPoint);

        this.getProfile = function () {
            var authData = rootRef.getAuth();
            var profilePath = 'users/' + authData.uid + '/profile';
            return refAuthDB.child(profilePath).once('value').then(function (snapshot) {
                return snapshot.val();
            });
        };

        this.getProfileByUserId = function (userId) {
            var userProfilePath = 'users/' + userId + '/profile';
            return refAuthDB.child(userProfilePath).once('value').then(function (snapshot) {
                return snapshot.val();
            });
        };

        this.setProfile = function (newProfile) {
            var authData = rootRef.getAuth();
            var profilePath = 'users/' + authData.uid + '/profile';
            return refAuthDB.child(profilePath).once('value').then(function (snapshot) {
                var profile = snapshot.val();
                return profile ? refAuthDB.child(profilePath).update(newProfile) : refAuthDB.child(profilePath).set(newProfile);
            });

        };

        this.getCurrUserId = function(){
            var authData = rootRef.getAuth();
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
});
