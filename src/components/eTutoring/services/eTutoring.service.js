(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .provider('ETutoringService', function () {

            var getIconNameByCategoryIdWrapper;

            this.setGetIconNameByCategoryId = function (fn) {
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
