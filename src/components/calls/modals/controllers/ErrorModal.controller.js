(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('ErrorModalCtrl',
        function ($scope, CallsUiSrv) {
            'ngInject';
            $scope.errorMessage = this.modalData.errorMessage;
            $scope.errorValues = this.modalData.errorValues;
            $scope.closeModal = CallsUiSrv.closeModal;
        }
    );
})(angular);
