(function (angular) {
    'use strict';

    angular.module('znk.infra.enum', []);
})(angular);
'use strict';
(function (angular) {
    angular.module('znk.infra.enum').factory('EnumSrv', [
        function () {
            var EnumSrv = {};

            function BaseEnum(enumsArr) {
                var NAME_INDEX = 0;
                var ENUM_INDEX = 1;
                var VALUE_INDEX = 2;
                var self = this;
                enumsArr.forEach(function (item) {
                    self[item[NAME_INDEX]] = {
                        enum: item[ENUM_INDEX],
                        val: item[VALUE_INDEX]
                    };
                });
            }

            EnumSrv.BaseEnum = BaseEnum;

            BaseEnum.prototype.getEnumMap = function getEnumMap() {
                var enumsObj = this;
                var enumMap = {};
                var enumsPropKeys = Object.keys(enumsObj);
                for (var i in enumsPropKeys) {
                    var prop = enumsPropKeys[i];
                    var enumObj = enumsObj[prop];
                    enumMap[enumObj.enum] = enumObj.val;
                }
                return enumMap;
            };

            BaseEnum.prototype.getEnumArr = function getEnumArr() {
                var enumsObj = this;
                var enumArr = [];
                for (var prop in enumsObj) {
                    var enumObj = enumsObj[prop];
                    if (angular.isObject(enumObj)) {
                        enumArr.push(enumObj);
                    }
                }
                return enumArr;
            };

            BaseEnum.prototype.getValByEnum = function getValByEnum(id) {
                var enumsObj = this;
                var val;
                for (var prop in enumsObj) {
                  if (enumsObj.hasOwnProperty(prop)) {
                      var enumObj = enumsObj[prop];
                      if (enumObj.enum === id) {
                          val = enumObj.val;
                          break;
                      }
                  }
                }
                return val;
            };

            BaseEnum.prototype.getNameToEnumMap = function getValByEnum() {
                var enumsObj = this;
                var nameToEnumMap = {};

                var keys = Object.keys(enumsObj);
                keys.forEach(function(enumName){
                    var enumObj = enumsObj[enumName];
                    nameToEnumMap[enumName] = enumObj.enum;
                });

                return nameToEnumMap ;
            };

            EnumSrv.flashcardStatus = new BaseEnum([
                ['keep', 0, 'Keep'],
                ['remove', 1, 'Remove']
            ]);

            return EnumSrv;
        }
    ]);
})(angular);

angular.module('znk.infra.enum').run(['$templateCache', function($templateCache) {

}]);
