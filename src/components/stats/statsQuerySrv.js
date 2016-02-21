(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').service('StatsQuerySrv', [
        'StatsSrv',
        function (StatsSrv) {
            var StatsQuerySrv = {};

            function _getCategoryWeakness(category) {
                if (!category.totalQuestions) {
                    return -Infinity;
                }
                return (category.totalQuestions - category.correct) / (category.totalQuestions);
            }

            StatsQuerySrv.getWeakestCategoryInLevel = function(level, optionalIds){
                var currWeakestCategory = {};

                function _isOptional(categoryId){
                    if(!angular.isArray(optionalIds)){
                        return true;
                    }

                    return optionalIds.indexOf(categoryId) !== -1;
                }

                function _isMostWeakSoFar(categoryWeakness){
                    return angular.isUndefined(currWeakestCategory.weakness) || currWeakestCategory.weakness < categoryWeakness;
                }

                return StatsSrv.getLevelStats(level).then(function(levelStats){
                    angular.forEach(levelStats, function(categoryStats){
                        var categoryWeakness = _getCategoryWeakness(categoryStats);

                        if(_isOptional(categoryStats.id) && _isMostWeakSoFar(categoryWeakness)){
                            currWeakestCategory.weakness = categoryWeakness;
                            currWeakestCategory.category = angular.copy(categoryStats);
                            return;
                        }
                    });

                    if(currWeakestCategory.weakness === -Infinity){
                        return null;
                    }

                    return currWeakestCategory.category;
                });
            };

            return StatsQuerySrv;
        }
    ]);
})(angular);
