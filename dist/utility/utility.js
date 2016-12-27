(function (angular) {
    'use strict';

    angular.module('znk.infra.utility', []);
})(angular);

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

            UtilitySrv.object.convertToArray = function(obj){
                var arr = [];
                angular.forEach(obj, function(obj){
                    arr.push(obj);
                });
                return arr;
            };

            UtilitySrv.object.getKeyByValue = function(obj, value) {
                for( var prop in obj ) {
                    if( obj.hasOwnProperty( prop ) ) {
                        if( obj[ prop ] === value ) {
                            return prop;
                        }
                    }
                }
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

            UtilitySrv.array.sortByField = function(sortField){
                return function (arrA, arrB) {
                    if (arrA[sortField] > arrB[sortField]) {
                        return -1;
                    } else if (arrA[sortField] === arrB[sortField]) {
                        return 0;
                    }
                    return 1;
                };
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

            UtilitySrv.fn.isValidNumber = function(number){
                if(!angular.isNumber(number) && !angular.isString(number)){
                    return false;
                }

                return !isNaN(+number);
            };

            return UtilitySrv;
        }
    ]);
})(angular);

angular.module('znk.infra.utility').run(['$templateCache', function($templateCache) {

}]);
