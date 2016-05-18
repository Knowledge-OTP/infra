'use strict';

angular.module('znk.infra.user').service('UserSchoolsService', ['InfraConfigSrv', 'StorageSrv', 'ENV', '$http', 'UserGoalsService', '$q',
    function(InfraConfigSrv, StorageSrv, ENV, $http, UserGoalsService, $q) {
        var schoolsPath = StorageSrv.variables.appUserSpacePath + '/dreamSchools';

        this.getAppSchoolsList = function () {
            return $http.get(ENV.dreamSchoolJsonUrl, {
                timeout: ENV.promiseTimeOut,
                cache: true
            });
        };

        function _getUserSchoolsData() {
            return InfraConfigSrv.getStudentStorage().then(function(studentStorage) {
                var defaultValues = {
                    selectedSchools: []
                };
                return studentStorage.get(schoolsPath, defaultValues);
            });
        }

        function _setUserSchoolsData(userSchools) {
            return InfraConfigSrv.getStudentStorage().then(function(studentStorage) {
                 return studentStorage.set(schoolsPath, userSchools);
            });
        }

        this.getDreamSchools = function () {
            return _getUserSchoolsData().then(function (userSchools) {
                return userSchools.selectedSchools;
            });
        };

        this.setDreamSchools = function (newSchools, updateUserGoals) {
            return _getUserSchoolsData().then(function (userSchools) {
                if (!angular.isArray(newSchools) || !newSchools.length) {
                    newSchools = [];
                }

                if (userSchools.selectedSchools !== newSchools) {
                    userSchools.selectedSchools.splice(0);
                    angular.extend(userSchools.selectedSchools, newSchools);
                }

                var saveUserGoalProm = $q.when();
                if (updateUserGoals) {
                    saveUserGoalProm = UserGoalsService.calcCompositeScore(newSchools, true);
                }

                return $q.all([
                    _setUserSchoolsData(userSchools),
                    saveUserGoalProm
                ]).then(function (res) {
                    return res[0];
                });
            });
        };
}]);

