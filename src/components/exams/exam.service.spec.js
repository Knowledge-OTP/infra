/* eslint object-shorthand: 0 */
describe('testing service "ExamSrv":', function () {
    beforeEach(angular.mock.module('actWebApp', 'pascalprecht.translate', 'actShared', 'auth.mock'));

    beforeEach(angular.mock.module('pascalprecht.translate', function ($translateProvider) {
        $translateProvider.translations('en', {});
    }));

    var defer;

    beforeEach(angular.mock.module(function ($provide) {
        $provide.service('StorageRevSrv', function ($q) {
            return {
                getContent: function (data) {
                    defer = $q.defer();
                    defer.resolve(data);
                    return defer.promise;
                }
            };
        });
    }));

    var ExamSrv, $rootScope;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            ExamSrv = $injector.get('ExamSrv');
            $rootScope = $injector.get('$rootScope');
        }]));


    it('when ExamSrv.getExam called with an exam number it should send exerciseId and exerciseType: exam to StorageRevSrv', function () {
        var result = ExamSrv.getExam(32);
        var promiseResult = function (resp) {
            expect(resp).toEqual(jasmine.any(Object));
            expect(resp.exerciseId).toBeDefined();
            expect(resp.exerciseId).toEqual(32);
            expect(resp.exerciseType).toBeDefined();
            expect(resp.exerciseType).toEqual('exam');
        };
        result.then(promiseResult);
        $rootScope.$digest();
    });

    it('when ExamSrv.getExamSection called with an section number it should send exerciseId and exerciseType: section to StorageRevSrv', function () {
        var result = ExamSrv.getExamSection(1280);
        var promiseResult = function (resp) {
            expect(resp).toEqual(jasmine.any(Object));
            expect(resp.exerciseId).toBeDefined();
            expect(resp.exerciseId).toEqual(1280);
            expect(resp.exerciseType).toBeDefined();
            expect(resp.exerciseType).toEqual('section');
        };
        result.then(promiseResult);
        $rootScope.$digest();
    });
});
