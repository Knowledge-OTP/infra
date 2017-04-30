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
