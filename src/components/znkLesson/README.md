Live Lesson - Start / End feature
Remove the following buttons from the Educator & Student apps:
Call
Watch **** Screen
Share My Screen
Add a new button to the Educator app (where the call button is located, to replace it) called "Start Lesson"
After clicking "Start Lesson":
A modal popup should be displayed with the following title: "Lesson Subject"
The modal should have two buttons: "Start Math Lesson", "Start English Lesson"
After clicking one of the buttons the modal should close and the "Start Lesson" button should change to "End Lesson"
Also a new object should be created in FireBase under /root/###_app/lessons/[lesson_guid]
That will contain the following fields:
Lesson GUID
Educator UID
Student UID
StartTime
Duration
ExtendTime
Lesson Subject
Status (values: 1 = Active, 0 = Ended)
In addition, write the lesson GUID under /root/###_app/users/[student_uid]/Lessons/[lesson_guid]
AND under /root/###_dashboard/users/[educator_uid]/Lessons/[lesson_guid] with value = true
Keep 3 general parameters in FB (and default values locally in the config): Lesson Length, Lesson Extension Time, Lesson End Alert Time
While in an active lesson - the active panel should be visible for the student and the educator
After the educator clicks "End Lesson" add the End Time to the lesson object in FireBase, update the duration field and update the status to 0, and remove the objects under:
/root/###_app/users/[student_uid]/Lessons/[lesson_guid]
AND /root/###_dashboard/users/[educator_uid]/Lessons/[lesson_guid]
Each lesson should end automatically after 55 minutes + ExtendTime(in case the educator did not end it manually before) -> the lesson length should be a parameter in FB (Lesson should end even if the browsers are closed - backend)
[Lesson End Alert Time] minutes before [Lesson Length] + [ExtendTime] - the educator should get a pop up message saying the lesson is about to end, with two buttons: "Extend Lesson", "Close"
Clicking "Extend Lesson" will add [Lesson Extension Time] to the "ExtendTime" field in the lesson obj
Pop up text: Lesson will end in [Lesson End Alert Time], if you would like to extend the lesson by [Lesson Extension Time] please click "Extend Lesson"
When the backend closes a lesson, the educator and the student should get a pop up saying "Lesson Ended"
When the Educator starts the lesson - the student should get a pop up "You have joined an active lesson"
When the Educator ends the lesson - the student should get a pop up "Lesson Ended"
The orange border for the whole app should appear for both the educator & Student while there's an active lesson (currently it appears when there's a share screen - remove this). It should be orange for both users. Remove the "X" button at the top right corner of the border
Also remove the "Eye" icon in the orange border
Design
https://invis.io/Y9953Y9TU
https://invis.io/GF953YJRM
PSD
Teacher
https://drive.google.com/open?id=0B6KmbA2uZ6H4TzJhZUM2aXVRU28
Student
https://drive.google.com/open?id=0B6KmbA2uZ6H4X29nZkpKeTI2UE0
