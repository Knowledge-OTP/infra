(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', 'ZnkModuleResultsService', '$q',
        function (ZnkModuleService, ZnkModuleResultsService, $q) {
            var userAssignModuleService = {};

            userAssignModuleService.getAssignModules = function () {
                return ZnkModuleService.getHeaders().then(function (headers) {
                    var getPromArr = [];
                    angular.forEach(headers, function (header) {
                        var getProm = ZnkModuleResultsService.getModuleResult(header.id);
                        getPromArr.push(getProm);
                    });

                    return $q.all(getPromArr).then(function (moduleResults) {
                        angular.forEach(headers, function (header) {
                            header.results = moduleResults.filter(function (result) {
                                return header.id === result.moduleId;
                            })[0];
                        });

                        return headers;
                    });
                });
            };

            return userAssignModuleService;
        }
    ]);
})(angular);

