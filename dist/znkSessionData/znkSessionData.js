(function () {
    'use strict';

    angular.module('znk.infra.znkSessionData', [
        'znk.infra.enum',
        'znk.infra.userContext',
        'znk.infra.user'
    ]);
})();

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSessionData').factory('SessionBtnStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['OFFLINE_BTN', 1, 'offline btn'],
                ['START_BTN', 2, 'start btn'],
                ['ENDED_BTN', 3, 'ended btn']
            ]);
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSessionData').factory('SessionsStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['ENDED', 0, 'ended Session'],
                ['ACTIVE', 1, 'active Session']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    var subjectEnum = {
        MATH: 0,
        ENGLISH: 5
    };

    angular.module('znk.infra.znkSessionData').constant('SessionSubjectEnumConst', subjectEnum);

    angular.module('znk.infra.znkSessionData').factory('SessionSubjectEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';
            return new EnumSrv.BaseEnum([
                ['MATH', subjectEnum.MATH, 'math'],
                ['ENGLISH', subjectEnum.ENGLISH, 'english']
            ]);
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSessionData').provider('znkSessionDataSrv',
        function () {
            var _sessionSubjectsGetter;

            this.setSessionSubjects = function (sessionSubjectsGetter) {
                _sessionSubjectsGetter = sessionSubjectsGetter;
            };

            this.$get = ["$log", "$injector", "$q", "InfraConfigSrv", "ENV", "UserProfileService", function ($log, $injector, $q, InfraConfigSrv, ENV, UserProfileService) {
                'ngInject';
                var znkSessionDataSrv = {};

                znkSessionDataSrv.getSessionSubjects = function () {
                    if (!_sessionSubjectsGetter) {
                        var errMsg = 'znkSessionDataSrv: sessionSubjectsGetter was not set';
                        $log.error(errMsg);
                        return $q.reject(errMsg);
                    }
                    return $q.when($injector.invoke(_sessionSubjectsGetter));
                };

                znkSessionDataSrv.isActiveLiveSession = function () {
                    return new Promise(function(resolve, reject) {
                        UserProfileService.getCurrUserId().then(function (currUid) {
                            InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                                var appName = ENV.firebaseAppScopeName;
                                var userLiveSessionPath = appName + '/users/' + currUid + '/liveSession/active';
                                globalStorage.get(userLiveSessionPath).then(function (liveSessionGuid) {
                                    resolve(!angular.equals(liveSessionGuid, {}));
                                });
                            });
                        }).catch(function (err) {
                            reject('isActiveLiveSession: Error: ' + err);
                        });
                    });
                };

                return znkSessionDataSrv;
            }];

        });
})(angular);

angular.module('znk.infra.znkSessionData').run(['$templateCache', function ($templateCache) {

}]);
