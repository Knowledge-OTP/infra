(function (angular) {
    'use strict';

    angular.module('znk.infra.filters', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.filters').filter('capitalize', [
        function () {
            return function (str) {
                if(!angular.isString(str) || !str.length){
                    return '';
                }
                
                return str[0].toUpperCase() + str.substr(1);
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';
    /**
     * @param time (in seconds)
     * @param exp (expression to display time)
     * @returns formatted time string
     */
    angular.module('znk.infra.filters').filter('formatDuration', ['$log', function ($log) {
        return function (time, exp) {
            if (!angular.isNumber(time) || isNaN(time)) {
                $log.error('time is not a number:', time);
                return '';
            }
            var t = Math.round(parseInt(time));
            var hours = parseInt(t / 3600, 10);
            t = t - (hours * 3600);
            var minutes = parseInt(t / 60, 10);
            var seconds = time % 60;
            var defaultFormat = 'mm:ss';

            if (!exp) {
                exp = defaultFormat;
            }

            return exp.replace(/hh/g, hours).replace(/mm/g, minutes).replace(/ss/g, seconds);
        };
    }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.filters').filter('formatTimeDuration', ['$log', function ($log) {
            return function (time, exp) {
                if (!angular.isNumber(time) || isNaN(time)) {
                    $log.error('time is not a number:', time);
                    return '';
                }
                var t = Math.round(parseInt(time));
                var hours = parseInt(t / 3600000, 10);
                var minutes = parseInt(t / 60000, 10);
                var seconds = time / 1000;
                var defaultFormat = 'mm';

                if (!exp) {
                    exp = defaultFormat;
                }
                return exp.replace(/hh/g, hours).replace(/mm/g, minutes).replace(/ss/g, seconds);
            };
        }]);
})(angular);

angular.module('znk.infra.filters').run(['$templateCache', function($templateCache) {

}]);
