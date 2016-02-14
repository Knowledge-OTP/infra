(function(){
    jasmine.getFixtures().fixturesPath = "base/test/jsonFixtures/";

    window.content = JSON.parse(readFixtures("content.json"));

/*  cleaning content
    var exercise = content.;
    exercise.questionsGroupData.forEach(function(question){if(!question.paragraphs)return;question.paragraphs.forEach(function(paragraph){paragraph.body='body'})})

    exercise.questions.forEach(function(question){if(!question.paragraphs)return;question.paragraphs.forEach(function(paragraph){paragraph.body='body'})})

    exercise.questions.forEach(function(question){question.paragraph="paragraph"})

    exercise.questions.forEach(function(question){question.content= 'content for question id:' + question.id})

    exercise.questions.forEach(function(question){question.writtenSln= 'written solution for question id:' + question.id})

    exercise.questions.forEach(function(question){question.answers.forEach(function(answer){answer.content='content'})})*/
})();
