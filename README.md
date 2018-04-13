# AgingInPlace
This is the Source Code Repository for the Alexa skill Grace Care.  It is used to help Seniors live at home, but stay in touch with their caregivers using Amazon Echo devices.

This started as a student project between BCIT's CIT program and Paul Cassidy.

## Contact
Owner:  [Paul Cassidy](mailto:paulcassidy99@hotmail.ca)

Students:
* [Abraham Al Jundi](mailto:work.aaljundi1@gmail.com)
* [Alex Christensen](mailto:alexschristensen@gmail.com)
* [Brett Dixon](mailto:brettdixon1@gmail.com)
* [Daniel Kole](mailto:dkole@my.bcit.ca)
* [Cheuk Hin (Kelvin) Lau](mailto:chkelvinlau@gmail.com)

## Features

### Express Moods
Seniors can express how they are feeling through their Amazon Echos.  These feelings are categorized as Happy, Neutral, or Sad.

### Check Ins / Check Outs
Allows in home services to check in and check out helping seniors to checkin in through an Amazon Echo.  The times and duration of stay are recorded in a Database.

### Status Report
Allows caregivers to recieve a status report about their seniors through there Echos.  Status report shows the last 7 days of expressed moods and in home service visits.

## Technology
This code is designed to work with AWS Lambda.

It uses Node.JS 6.10, which was the highest version supported by AWS Lambda at the time of development (April 2018).

The skill connects to a PostgreSQL DB.  The SQL folder contains instructions how how to recreate our DB's schema.


## User Documentation
[User Documentation for Grace Care Skill](https://helpformomanddad.today/wp-content/uploads/2018/04/Grace-Care-User-Guide-Rev-0.pdf)