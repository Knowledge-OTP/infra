(function (angular) {
    'use strict';

    angular.module('znk.infra.utility').factory('UtilitySrv', [
        function () {
            var UtilitySrv = {};

            UtilitySrv.general = {};

            UtilitySrv.general.createGuid = function(){
                function s4() {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); // jshint ignore:line
                }

                return (s4() + s4() + '-' + s4() + '-4' + s4().substr(0, 3) + '-' + s4() + '-' + s4() + s4() + s4()).toLowerCase();
            };

            return UtilitySrv;
        }
    ]);
})(angular);
