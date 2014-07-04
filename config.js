var moment = moment = require('moment');


var config = {
    twitter: {
        consumer_key: 'Hk5KmVi1m8qTBSHoHMW9uNftq',
        consumer_secret: 'TWFQtzVksG00XTYyG1pCMg2JKr8dDxvxkgTuybO1zHqQLVKzcI',
        access_token_key: '130642682-V3eNbXH4PpN4Rg3ySdhOfUzQS7413YJbyNxheGgp',
        access_token_secret: 'GHZd4cCV1z9e6LlwiiY6gICgAGAk7Yu5K7auYGmfFqhZO'
    },
    
    mongoUri: process.env.MONGOLAB_URI || 'mongodb://localhost:27017/sqli',
    httpPort: process.env.PORT || 8080,
    
    matcher: /^Merci ([a-z]+) /i,
    hashtag: 'LeBonSamaritainSQLI'.toLowerCase(),
    startDate: moment('2014-06-16T00:00:00+02:00').toDate(),
    endDate: moment('2014-08-18T00:00:00+02:00').toDate()
};


module.exports = config;