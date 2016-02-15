describe('testing directive "compileDrv":', function () {
    var $compile,
        $rootScope,
        $httpBackend;

    // Load  the module, which contains the directive
    beforeEach(module('znk.infra.general', 'htmlTemplates'));

    // Store references to $rootScope and $compile
    // so they are available to all tests in this describe block
    beforeEach(inject(['$compile', '$rootScope', '$httpBackend',
        function (_$compile, _$rootScope, _$httpBackend) {
            // The injector unwraps the underscores (_) from around the parameter names when
            // matching
            $compile = _$compile;
            $rootScope = _$rootScope;
            $httpBackend = _$httpBackend;
        }]));

    //compile the given htmlStr with the given scope
    function compileHtmlStr(scope, htmlStr) {
        return $compile(htmlStr)(scope);
    }

    //compile simple string test
    it('Compile simple string', function () {
        var $scope = $rootScope.$new();
        $scope.content = 'Compile simple string';
        // Compile a piece of HTML containing the directive
        var element = compileHtmlStr($scope, "<div compile='content'></div>");
        // fire all the watches, so the scope expressions will be evaluated
        $scope.$digest();
        // Check that the compiled element contains the templated content
        expect(element.html()).toContain('Compile simple string');
    });
    //compile html string test
    it('Compile html string', function () {
        var $scope = $rootScope.$new();
        $scope.content = '<div>{{innerContent}}</div>';
        $scope.innerContent = 'inner content';
        // Compile a piece of HTML containing the directive
        var element = compileHtmlStr($scope, "<div compile='content'></div>");
        // fire all the watches, so the scope expressions will be evaluated
        $scope.$digest();
        // in advanced angular version, 'ng-scope' class added to element class list, need to
        // remove to support old version
        element.find('div').removeClass('ng-scope');
        // Check that the compiled element contains the templated content
        expect(element.html()).toContain('<div class=\'ng-binding\'>inner content</div>');
    });
});
