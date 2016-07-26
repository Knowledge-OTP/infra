(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('IncomingCallModalCtrl', ['modalData',
        function (modalData) {
            'ngInject';

            console.log(modalData);
        }]
    );
})(angular);
