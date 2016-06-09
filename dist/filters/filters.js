(function (angular) {
    'use strict';

    angular.module('znk.infra.filters', []);
})(angular);

(function (angular) {
    'use strict';
    function formatTime() {
        return function(time) {
            var t = parseInt(time, 10);
            var hours = parseInt(t / 3600, 10); t = t - (hours * 3600);
            var minutes = parseInt(t / 60, 10); t = t - (minutes * 60);
            var content = '';
            if (hours) {
                if (content) {
                    content += ', ';
                }
                content += hours + 'h';
            }
            if (minutes > 0) {
                if (content) {
                    content += ', ' + minutes + 'm';
                } else {
                    content += minutes + 'm';
                }
            }
            if (time < 60) {content += t + ' sec';}
            return content;
        };
    }

    angular.module('znk.infra.filters').filter('formatTime', formatTime);

})(angular);

angular.module('znk.infra.filters').run(['$templateCache', function($templateCache) {

}]);
