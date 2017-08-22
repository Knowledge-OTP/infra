(function (angular) {
    'use strict';

    angular.module('znk.infra.userContext', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.userContext').service('StudentContextSrv', ['$window', '$log',

        function ($window, $log) {
            var StudentContextSrv = {};

            var _storageStudentUidKey = 'currentStudentUid';
            var _currentStudentUid = '';
            var registeredCbsToStudentContextChangeEvent = [];

            StudentContextSrv.getCurrUid = function () {
                if (_currentStudentUid.length === 0) {
                    if ($window.sessionStorage) {
                        var storedCurrentUid = $window.sessionStorage.getItem(_storageStudentUidKey);
                        if (storedCurrentUid) {
                            _currentStudentUid = storedCurrentUid;

                        } else {
                            $log.error('StudentContextSrv: no student uid');
                        }
                    } else {
                        $log.error('StudentContextSrv: no student uid');
                    }
                }
                return _currentStudentUid;
            };

            StudentContextSrv.setCurrentUid = function (uid) {
                var prevUid = _currentStudentUid;
                _currentStudentUid = uid;

                if ($window.sessionStorage) {
                    $window.sessionStorage.setItem(_storageStudentUidKey, uid);
                }

                _invokeCbs(registeredCbsToStudentContextChangeEvent, [prevUid, uid]);
            };

            StudentContextSrv.registerToStudentContextChange = function(cb) {
                if (!angular.isFunction(cb)) {
                    $log.error('StudentContextSrv.registerToStudentContextChange: cb is not a function', cb);
                    return;
                }
                registeredCbsToStudentContextChangeEvent.push(cb);
            };

            function _invokeCbs(cbArr, args){
                cbArr.forEach(function(cb){
                    cb.apply(null, args);
                });
            }

            return StudentContextSrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.userContext').service('TeacherContextSrv', ['$window', '$log', '$q',

        function ($window, $log, $q) {
            var TeacherContextSrv = {};

            var _storageTeacherUidKey = 'currentTeacherUid';
            var _currentTeacherUid = '';
            var registeredCbsToTeacherContextChangeEvent = [];

            TeacherContextSrv.getCurrUid = function () {
                if (_currentTeacherUid.length === 0) {
                    if ($window.sessionStorage) {
                        var storedCurrentUid = $window.sessionStorage.getItem(_storageTeacherUidKey);
                        if (storedCurrentUid) {
                            _currentTeacherUid = storedCurrentUid;

                        } else {
                            $log.error('TeacherContextSrv: no teacher uid');
                        }
                    } else {
                        $log.error('TeacherContextSrv: no teacher uid');
                    }
                }
                return $q.when(_currentTeacherUid);
            };

            TeacherContextSrv.setCurrentUid = function (uid) {
                var prevUid = _currentTeacherUid;
                _currentTeacherUid = uid;

                if ($window.sessionStorage) {
                    $window.sessionStorage.setItem(_storageTeacherUidKey, uid);
                }

                _invokeCbs(registeredCbsToTeacherContextChangeEvent, [prevUid, uid]);
            };

            TeacherContextSrv.registerToTeacherContextChange = function(cb) {
                if (!angular.isFunction(cb)) {
                    $log.error('TeacherContextSrv.registerToTeacherContextChange: cb is not a function', cb);
                    return;
                }
                registeredCbsToTeacherContextChangeEvent.push(cb);
            };

            function _invokeCbs(cbArr, args){
                cbArr.forEach(function(cb){
                    cb.apply(null, args);
                });
            }

            return TeacherContextSrv;
        }
    ]);
})(angular);

angular.module('znk.infra.userContext').run(['$templateCache', function($templateCache) {

}]);
