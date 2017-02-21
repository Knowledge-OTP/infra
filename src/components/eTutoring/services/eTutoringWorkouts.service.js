(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .provider('ETutoringService', function (ExerciseTypeEnum, $log, DrillSrv,
                                                TutorialSrv, ExerciseResultSrv, $q, PracticeSrv, LectureSrv, AuthService, CategoryService, TestScoreCategoryEnum) {
            'ngInject';

            var getIconNameByCategoryIdWrapper = function (CategoryService) {
                'ngInject'; // jshint ignore:line
                return function (categoryId) {
                    return CategoryService.getCategoryLevel2Parent(categoryId).then(function (testScoreObj) {
                        switch (testScoreObj.id) {
                            case TestScoreCategoryEnum.MATH.enum:
                                return 'calculator-icon';

                            case TestScoreCategoryEnum.WRITING.enum:
                                return 'writing-icon';

                            case TestScoreCategoryEnum.READING.enum:
                                return 'reading-icon';

                            case TestScoreCategoryEnum.ESSAY.enum:
                                return 'essay-icon';
                            default:
                                break;
                        }
                    });
                };
            };

            this.setGetIconNameByCategoryIdWrapper = function (fn) {
                getIconNameByCategoryIdWrapper = fn;
            };

            this.$get = function ($injector, $log, $q) {
                var ETutoringService = {};

                ETutoringService.getIconNameByCategoryId = function (categoryId) {
                    if(angular.isUndefined(getIconNameByCategoryIdWrapper)){
                        $log.error('ETutoringService: getIconNameByCategoryIdWrapper was not set up in config phase!');
                        return $q.when();
                    } else {
                        var getIconNameByCategoryId = $injector.invoke(getIconNameByCategoryIdWrapper);
                        return getIconNameByCategoryId(categoryId);
                    }
                };
                return ETutoringService;
            };
        });
})(angular);
