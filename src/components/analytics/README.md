## Znk Analytics

demo src: demo/analytics

run demo: grunt serve:analytics

debug mode, if set to true, can see the events

by typing znkAnalyticsEvents in console.

# known handlers: 
            eventTrack
            timeTrack
            pageTrack
            setUsername
            setUserProperties

# usage of timeTrack:

to use timeTrack correctly with mixpanel:

when you want to start the tracking of time:

      znkAnalyticsSrv.timeTrack({ eventName: 'eventName' });
  
to finish time tracking use eventTrack with the same 

eventName, and a duration property will be added to 
   
mixpanel event with the time between the timeTrack to eventTrack:
  
      znkAnalyticsSrv.eventTrack({ eventName: 'eventName' });
   
  
