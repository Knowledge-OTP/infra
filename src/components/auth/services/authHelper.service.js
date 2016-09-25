(function (angular) {
    'use strict';

    angular.module('znk.infra.auth')
        .service('AuthHelperService', function ($filter, ENV) {
            'ngInject';

            var translateFilter = $filter('translate');
            var excludeDomains = ['mailinator.com'];

            this.errorMessages = {
                DEFAULT_ERROR: translateFilter('AUTH_HELPER.DEFAULT_ERROR_MESSAGE'),
                FB_ERROR: translateFilter('AUTH_HELPER.FACEBOOK_ERROR'),
                EMAIL_EXIST: translateFilter('AUTH_HELPER.EMAIL_EXIST'),
                INVALID_EMAIL: translateFilter('AUTH_HELPER.INVALID_EMAIL'),
                NO_INTERNET_CONNECTION_ERR: translateFilter('AUTH_HELPER.NO_INTERNET_CONNECTION_ERR'),
                EMAIL_NOT_EXIST: translateFilter('AUTH_HELPER.EMAIL_NOT_EXIST'),
                INCORRECT_EMAIL_AND_PASSWORD_COMBINATION: translateFilter('AUTH_HELPER.INCORRECT_EMAIL_AND_PASSWORD_COMBINATION')
            };

            this.isDomainExclude = function (userEmail) {
                var userDomain = userEmail.substr(userEmail.indexOf('@') + 1);
                if (userDomain.toLowerCase() !== 'zinkerz.com' && ENV.enforceZinkerzDomainSignup) {
                    return true;
                }

                var domains = excludeDomains.filter(function (excludeDomain) {
                    return excludeDomain === userDomain;
                });
                return domains.length > 0;
            };
        });
})(angular);
