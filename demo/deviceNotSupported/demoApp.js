(function (angular) {
    'use strict';

    angular
        .module('demoApp', ['znk.infra.deviceNotSupported'])
        .controller('myController', [function () {
                var self = this;
                self.title = 'My Title';
                self.subtitle = 'My Subtitle';
                self.imgSrc = 'http://dev-act.zinkerz.com.s3-website-eu-west-1.amazonaws.com/assets/images/not-supported-browsers-img.png';
            }]
        );
})(angular);
