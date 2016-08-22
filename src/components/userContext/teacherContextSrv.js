(function (angular) {
    'use strict';

    angular.module('znk.infra.userContext').service('TeacherContextSrv', ['$window', '$log',

        function ($window, $log) {
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
                return _currentTeacherUid;
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
