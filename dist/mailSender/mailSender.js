(function (angular) {
    'use strict';
    angular.module('znk.infra.mailSender', []);
})(angular);

(function (angular) {
    'use strict';
    angular.module('znk.infra.mailSender').service('MailSenderService', [
        '$log', 'ENV', '$http', 'UserProfileService', '$q',
        function ($log, ENV, $http, UserProfileService, $q) {
            var mailSenderService = {};
            var backendUrl = ENV.backendEndpoint + 'email/sendTemplate';
            var httpConfig = {
                headers: 'application/json'
            };

            mailSenderService.postMailRequest = function (mailObject) {
                return UserProfileService.getCurrUserId().then(function (userId) {
                    mailObject.uid = userId;
                    mailObject.serviceId = ENV.serviceId;
                    return $http.post(backendUrl, mailObject, httpConfig).then(
                        function (response) {
                            return {
                                data: response.data
                            };
                        }).catch(function (error) {
                        return $q.reject({
                            data: error.data
                        });
                    });
                });
            };

            return mailSenderService;
        }
    ]);
})(angular);


angular.module('znk.infra.mailSender').run(['$templateCache', function ($templateCache) {

}]);
