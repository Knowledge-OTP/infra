(function (angular) {
    'use strict';

    angular.module('znk.infra.utility').factory('UtilitySrv', [
        '$q',
        function ($q) {
            var UtilitySrv = {};

            //general utility functions
            UtilitySrv.general = {};

            UtilitySrv.general.createGuid = function(){
                function s4() {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); // jshint ignore:line
                }

                return (s4() + s4() + '-' + s4() + '-4' + s4().substr(0, 3) + '-' + s4() + '-' + s4() + s4() + s4()).toLowerCase();
            };

            // object utility function
            UtilitySrv.object = {};

            UtilitySrv.object.extendWithoutOverride = function(dest, src){
                angular.forEach(src, function(val,key){
                    if(!dest.hasOwnProperty(key)){
                        dest[key] = val;
                    }
                });
            };

            //array utility srv
            UtilitySrv.array = {};

            UtilitySrv.array.convertToMap = function(arr, keyProp){
                if(angular.isUndefined(keyProp)){
                    keyProp = 'id';
                }
                var map = {};
                arr.forEach(function(item){
                    map[item[keyProp]] = item;
                });
                return map;
            };

            UtilitySrv.fn = {};

            UtilitySrv.fn.singletonPromise = function(promGetter){
                var prom;
                return function(){
                    if(!prom){
                        prom = $q.when(angular.isFunction(promGetter) ? promGetter() : promGetter);
                    }
                    return prom;
                };
            };
            return UtilitySrv;
        }
    ]);
})(angular);
