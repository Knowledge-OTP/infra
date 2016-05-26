(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
        //function ($window, $firebaseAuth, ENV, $q, $timeout, $rootScope, $http, $log, $injector) {
        //    'ngInject';

        function () {
            var auth = {};

            auth.getAuth = function() {
                return {
                    uid:231323
                };

            };

            return auth;
        });
})(angular);
