(function (angular) {
    'use strict';

    angular.module('znk.infra.userContext').service('TeacherContextSrv', ['$window', '$log',

        function ($window, $log) {
            var TeacherContextSrv = {};

            var _storageTeacherUidKey = 'currentTeacherUid';
            var _currentTeacherUid = '';

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
                return _currentTeacherUid;
            };

            TeacherContextSrv.setCurrentUid = function (uid) {
                _currentTeacherUid = uid;

                if ($window.sessionStorage) {
                    $window.sessionStorage.setItem(_storageTeacherUidKey, uid);
                }
            };

            return TeacherContextSrv;
        }
    ]);
})(angular);
