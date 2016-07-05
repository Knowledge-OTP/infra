(function (angular) {
    'use strict';

    angular.module('znk.infra.user', []);
})(angular);

(function(angular, Firebase){
    'use strict';

    angular.module('znk.infra.user')
        .run(["UserSessionSrv", "ENV", "InfraConfigSrv", function(UserSessionSrv, ENV, InfraConfigSrv){
            'ngInject';

            var isLastSessionRecordEnabled = !UserSessionSrv.isLastSessionRecordDisabled();
            if(isLastSessionRecordEnabled){
                InfraConfigSrv.getUserData().then(function(userData){
                    var globalLastSessionRef = new Firebase(ENV.fbDataEndPoint + ENV.firebaseAppScopeName + '/lastSessions/' + userData.uid, ENV.firebaseAppScopeName);
                    globalLastSessionRef.child('began').set(Firebase.ServerValue.TIMESTAMP);
                    globalLastSessionRef.child('ended').set(null);
                    globalLastSessionRef.child('ended').onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
                });
            }
        }]);
})(angular, Firebase);

'use strict';

angular.module('znk.infra.user').service('UserProfileService',
    ["InfraConfigSrv", "StorageSrv", function (InfraConfigSrv, StorageSrv) {
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
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.user').provider('UserSessionSrv',
        function () {
            'ngInject';

            var isLastSessionRecordDisabled = false;
            this.disableLastSessionRecord = function(isDisbaled){
                isLastSessionRecordDisabled = !!isDisbaled;
            };

            this.$get = function(){
                // 'ngInject';

                var UserSessionSrv = {};

                UserSessionSrv.isLastSessionRecordDisabled = function(){
                    return isLastSessionRecordDisabled;
                };

                return UserSessionSrv;
            };
        }
    );
})(angular);

angular.module('znk.infra.user').run(['$templateCache', function($templateCache) {

}]);
