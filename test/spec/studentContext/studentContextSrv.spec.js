describe('testing service "StudentContextSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra-dashboard.userContext', 'htmlTemplates', 'testUtility'));

    var StudentContextSrv, $q;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            StudentContextSrv = $injector.get('StudentContextSrv');
            $q = $injector.get('$q');
        }
    ]));

    it('when initializing, student current uid is empty', function () {
        expect(StudentContextSrv.getCurrUid()).toEqual('');
    });

    it('when set a spesific student uid, this is the returned student current uid', function () {
        var _studentUid = 'abcd-12345-efgh-7890';

        StudentContextSrv.setCurrentUid(_studentUid);
        expect(StudentContextSrv.getCurrUid()).toEqual(_studentUid);
    });

});
