(function (angular) {
    'use strict';
    angular.module('znk.infra.mailSender', []);
})(angular);

(function (angular) {
    'use strict';
    angular.module('znk.infra.mailSender').service('MailSenderServiceService', [
        '$log', 'ENV', '$http', 'UserProfileService',
        function ($log, ENV, $http, UserProfileService) {
            var mailSenderService = {};
            var backendUrl = ENV.backendEndpoint + 'mail';
            var httpConfig = {
                headers: 'application/json'
            };

            mailSenderService.postMailRequest = function (mailObject) {
                return UserProfileService.getProfile().then(function (profile) {
                    mailObject.uid = profile.uid;
                    return $http.post(backendUrl, mailObject, httpConfig).then(
                        function (response) {
                            return {
                                data: response.data
                            };
                        },
                        function (error) {
                            return {
                                data: error.data
                            };
                        });
                });
            };

            return mailSenderService;
        }
    ]);
})(angular);


angular.module('znk.infra.mailSender').run(['$templateCache', function($templateCache) {

}]);
