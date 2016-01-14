(function (angular) {
    'use strict';

    angular.module('testUtility').factory('TestUtilitySrv',
        function ($rootScope, $q) {
            var TestUtilitySrv = {};

            TestUtilitySrv.general = {};

            TestUtilitySrv.general.asyncToSync = function(fn,context){
                return function(){
                    var val;
                    $q.when(fn.apply(context||this ,arguments)).then(function(_val){
                        val = _val;
                    });
                    $rootScope.$digest();
                    return val;
                };
            };

            TestUtilitySrv .general.convertAllAsyncToSync = function(asyncActionsObj){
                var syncActionsObj = {};
                var keys = Object.keys(asyncActionsObj);
                keys.forEach(function(key){
                    if(angular.isFunction(asyncActionsObj[key])){
                        syncActionsObj[key] = TestUtilitySrv.general.asyncToSync(asyncActionsObj[key],asyncActionsObj);
                    }
                });
                return syncActionsObj;
            };

            return TestUtilitySrv;
        }
    );
})(angular);
