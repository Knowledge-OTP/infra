(function (angular) {
    'use strict';

    angular.module('demo', ['znk.infra.auth', 'firebase'])
        .controller('main', function (AuthService) {
            var x;
        })
        .service('ENV', function () {
            this.fbGlobalEndPoint = "https://znk-dev.firebaseio.com/";
            this.backendEndpoint = "https://znk-web-backend-dev.azurewebsites.net/";
            this.fbDataEndPoint = "https://act-dev.firebaseio.com/";
            this.dataAuthSecret = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoicmFjY29vbnMifQ.mqdcwRt0W5v5QqfzVUBfUcQarD0IojEFNisP-SNIFLM";
            this.redirectLogin = "http://dev-act.zinkerz.com.s3-website-eu-west-1.amazonaws.com/";
            this.firebaseAppScopeName = "act_app";
        })

})(angular);
