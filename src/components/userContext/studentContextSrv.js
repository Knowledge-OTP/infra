(function (angular) {
    'use strict';

    angular.module('znk.infra-dashboard.userContext').service('StudentContextSrv', ['$window', '$log',

        function ($window, $log) {
            var StudentContextSrv = {};

            var _storageStudentUidKey = 'currentStudentUid';
            var _currentStudentUid = '';

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
                _currentStudentUid = uid;

                if ($window.sessionStorage) {
                    $window.sessionStorage.setItem(_storageStudentUidKey, uid);
                }
            };

            return StudentContextSrv;
        }
    ]);
})(angular);
