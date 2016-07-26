(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('OutgoingCallModalCtrl', ['modalData',
        function (modalData) {
            'ngInject';
            console.log(modalData);
        }]
    );
})(angular);
