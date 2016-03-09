describe('testing service "PopUpSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.popUp', 'htmlTemplates'));

    var $rootScope, PopUpSrv;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            PopUpSrv = $injector.get('PopUpSrv');
        }]));

    it('when popSrv initialized then znk-popup element should be added to the dom once', function () {
        var popUpElem = document.querySelectorAll('.znk-popup');
        expect(popUpElem).toBeDefined();
        expect(popUpElem.length).toBe(1);
    });
});
