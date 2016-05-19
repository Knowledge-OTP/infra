(function (angular) {
    'use strict';

    angular.module('znk.infra.user', []);
})(angular);

'use strict';

angular.module('znk.infra.user').service('UserGoalsService', ['InfraConfigSrv', 'StorageSrv', '$q',
    function (InfraConfigSrv, StorageSrv, $q) {
        var goalsPath = StorageSrv.variables.appUserSpacePath + '/goals';
        var defaultSubjectScore = 600;
        var self = this;

        this.getGoals = function () {
            return InfraConfigSrv.getStudentStorage().then(function(studentStorage) {
                return studentStorage.get(goalsPath).then(function (userGoals) {
                    if (angular.equals(userGoals, {})) {
                        userGoals = _defaultUserGoals();
                    }
                    return userGoals;
                });
            });
        };

        this.setGoals = function (newGoals) {
            return InfraConfigSrv.getStudentStorage().then(function(studentStorage) {
                if (arguments.length && angular.isDefined(newGoals)) {
                    return studentStorage.set(goalsPath, newGoals);
                }
                return studentStorage.get(goalsPath).then(function (userGoals) {
                    if (!userGoals.goals) {
                        userGoals.goals = {
                            isCompleted: false,
                            verbal: defaultSubjectScore,
                            math: defaultSubjectScore,
                            totalScore: defaultSubjectScore * 2
                        };
                    }
                    return userGoals;
                });
            });
        };

        this.calcCompositeScore = function (userSchools, save) {
            // The calculation for composite score in ACT:
            // 1. For each school in US, we have min & max score
            // 2. Calc the average score for each school and set it for each subject goal

            return this.getGoals().then(function (userGoals) {
                var minSchoolScore = 400,
                    maxSchoolScore = 1600,
                    avgScores = [];

                angular.forEach(userSchools, function (school) {
                    var school25th = isNaN(school.total25th) ? minSchoolScore : school.total25th;
                    var school75th = isNaN(school.total75th) ? maxSchoolScore : school.total75th;
                    avgScores.push((school25th * 0.25) + (school75th * 0.75));
                });

                var avgSchoolsScore;
                if (avgScores.length) {
                    avgSchoolsScore = avgScores.reduce(function (a, b) {
                        return a + b;
                    });
                    avgSchoolsScore = Math.round(avgSchoolsScore / avgScores.length);
                } else {
                    avgSchoolsScore = defaultSubjectScore;
                }

                userGoals = {
                    isCompleted: false,
                    verbal: avgSchoolsScore || defaultSubjectScore,
                    math: avgSchoolsScore || defaultSubjectScore
                };

                userGoals.compositeScore = averageSubjectsGoal(userGoals);
                return save ? self.setGoals(userGoals) : $q.when(userGoals);
            });
        };

        function _defaultUserGoals() {
            return {
                isCompleted: false,
                verbal: defaultSubjectScore,
                math: defaultSubjectScore,
                totalScore: defaultSubjectScore * 2
            };
        }

        function averageSubjectsGoal(goals) {
            var math = goals.math || defaultSubjectScore;
            var verbal = goals.english || defaultSubjectScore;
            return Math.round((math + verbal) / 2);
        }
}]);

'use strict';

angular.module('znk.infra.user').service('UserProfileService',
    function (InfraConfigSrv, StorageSrv) {

        var profilePath = StorageSrv.variables.appUserSpacePath + '/profile';

        this.getProfile = function () {
            return InfraConfigSrv.getGlobalStorage().then(function(globalStorage) {
                return globalStorage.get(profilePath).then(function (profile) {
                    if (profile && (angular.isDefined(profile.email) || angular.isDefined(profile.nickname))) {
                        return profile;
                    }
                    return InfraConfigSrv.getUserData().then(function(authData) {
                        var emailFromAuth = authData.password ? authData.password.email : '';
                        var nickNameFromAuth = authData.auth ? authData.auth.name : emailFromAuth;

                        if (!profile.email) {
                            profile.email = emailFromAuth;
                        }
                        if (!profile.nickname) {
                            profile.nickname = nickNameFromAuth;
                        }
                        if (!profile.createdTime) {
                            profile.createdTime = StorageSrv.variables.currTimeStamp;
                        }

                        return globalStorage.set(profilePath, profile);
                    });
                });
            });
        };

        this.setProfile = function (newProfile) {
            return InfraConfigSrv.getGlobalStorage().then(function(globalStorage) {
                return globalStorage.set(profilePath, newProfile);
            });
        };
});

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


angular.module('znk.infra.user').run(['$templateCache', function($templateCache) {

}]);
