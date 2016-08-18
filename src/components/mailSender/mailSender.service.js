(function (angular) {
    'use strict';
    angular.module('znk.infra.mailSender').service('MailSenderService', [
        '$log', 'ENV', '$http', 'UserProfileService',
        function ($log, ENV, $http, UserProfileService) {
            var mailSenderService = {};
            var backendUrl = ENV.backendEndpoint + 'mail';
            var httpConfig = {
                headers: 'application/json'
            };

            mailSenderService.postMailRequest = function (mailObject) {
                return UserProfileService.getCurrUserId().then(function (userId) {
                    mailObject.uid = userId;
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

