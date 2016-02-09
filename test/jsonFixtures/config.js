(function(){
    jasmine.getFixtures().fixturesPath = "base/test/jsonFixtures/";

    window.content = JSON.parse(readFixtures("content.json"));
    window.freeContent  = JSON.parse(readFixtures("freeContent.json"));
    window.iap = JSON.parse(readFixtures("iap.json"));
    window.abTesting = JSON.parse(readFixtures("abTesting.json"));
})();
