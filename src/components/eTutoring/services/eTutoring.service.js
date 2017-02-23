(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .provider('ETutoringService', function () {

            var getIconNameByCategoryIdWrapper, appName;

            this.setGetIconNameByCategoryId = function (fn) {
                getIconNameByCategoryIdWrapper = fn;
            };

            this.setAppName = function(_appName){
                appName = _appName;
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

                ETutoringService.getAppName = function(){
                    return appName;
                };

                return ETutoringService;
            };
        });
})(angular);
