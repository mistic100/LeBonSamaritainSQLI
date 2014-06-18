var twitter = require('twitter'),
    log = require('./log.js')('TwitterReader'),
    mongodb = require('mongodb').MongoClient,
    util = require('util'),
    _ = require('underscore'),
    EventEmitter = require('events').EventEmitter;


var TwitterReader = function() {
  this.client = new twitter({
      consumer_key: 'Hk5KmVi1m8qTBSHoHMW9uNftq',
      consumer_secret: 'TWFQtzVksG00XTYyG1pCMg2JKr8dDxvxkgTuybO1zHqQLVKzcI',
      access_token_key: '130642682-V3eNbXH4PpN4Rg3ySdhOfUzQS7413YJbyNxheGgp',
      access_token_secret: 'GHZd4cCV1z9e6LlwiiY6gICgAGAk7Yu5K7auYGmfFqhZO'
  });

  this.collections = {
      statuses: null
  };
  
  this.matcher = /^Merci ([a-z]+) /i;
  this.hashtag = 'LeBonSamaritainSQLI'.toLowerCase();
  this.mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/sqli';
  
  this.counters = {
      helpers: {},
      helped: {},
      hashtags: {}
  };
};

util.inherits(TwitterReader, EventEmitter);

TwitterReader.prototype.init = function() {
    var that = this;

    mongodb.connect(this.mongoUri, function(err, db) {
        if (err) {
            log.error(err);
            return;
        }
        
        log.info('Init database connection');
        
        that.collections.statuses = db.collection('statuses');
        
        that.collections.statuses.find().sort({'_id': -1}).limit(1).toArray(function(err, tweets) {
            var since_id = tweets[0] ? tweets[0]._id : '0';
            log.info('Last tweet found: '+ since_id);
            
            that.grabOldTweets(since_id);
        });
        
        that.getAllTweets(function(tweets) {
            that.updateCounters(tweets);
        });
        
        that.initStream();
    });
};

TwitterReader.prototype.initStream = function() {
    var that = this;
    
    this.client.stream('filter', {
        track: '#'+this.hashtag
    }, function(stream) {
        stream.on('data', function(data) {
            var tweets = that.filterTweets([data]);
            
            if (tweets.length != 0) {
                log.debug(tweet[0].text);
                that.emit('newTweet', tweet[0]);
            
                that.saveTweets(tweets);
            }
        });
    });
};

TwitterReader.prototype.getAllTweets = function(callback) {
    var that = this;
    
    this.collections.statuses.find().sort({'_id': -1}).toArray(function(err, tweets) {
        callback(tweets);
    });
};

TwitterReader.prototype.getCounters = function() {
    return {
        helpers: _.toArray(this.counters.helpers),
        helped: _.toArray(this.counters.helped),
        hashtags: _.toArray(this.counters.hashtags)
    };
};

TwitterReader.prototype.filterTweets = function(tweets) {
    var that = this;
    
    return tweets
      .filter(function(tweet) {
          return that.matcher.test(tweet.text) && !tweet.retweeted_status;
      })
      .map(function(tweet) {
          var hashtags = [];
          if (tweet.entities && tweet.entities.hashtags) {
            hashtags = tweet.entities.hashtags
              .filter(function(tag) {
                  return tag.text.toLowerCase() != that.hashtag;
              })
              .map(function(tag) {
                  return tag.text;
              });
          }
          
          return {
              _id: tweet.id_str,
              created_at: tweet.created_at,
              text: tweet.text,
              target: tweet.text.match(that.matcher)[1].toLowerCase(),
              hashtags: hashtags,
              user: {
                  id: tweet.user.id_str,
                  name: tweet.user.name,
                  login: tweet.user.screen_name,
                  image: tweet.user.profile_image_url
              }
          };
      });
};

TwitterReader.prototype.grabOldTweets = function(since_id) {
    var that = this;
    
    log.info('Grab tweets from: '+ since_id);
    
    this.client.search('#'+this.hashtag, {
        count: 100,
        since_id: since_id,
        result_type: 'recent'
    }, function(data) {
        // many errors bubble up to this point and replace "data"
        // why ? nevermind, lets catch them and print "data"
        try {
            if (data.search_metadata.next_results) {
                var params = data.search_metadata.next_results.match(/^\?max_id=([0-9]+)&q=/);
                that.grabOldTweets(params[1]);
            }
        }
        catch (e) {
          console.log(data);
        }

        var tweets = that.filterTweets(data.statuses);
        that.saveTweets(tweets);
    });
};

TwitterReader.prototype.saveTweets = function(tweets) {
    var that = this;
    
    if (tweets.length>0) {
        log.info('Save '+ tweets.length +' tweets');
        
        this.collections.statuses.insert(tweets, function(){});
        
        this.updateCounters(tweets);
    }
};

TwitterReader.prototype.updateCounters = function(tweets) {
    var that = this;
    
    tweets.forEach(function(tweet) {
        if (!that.counters.helpers[tweet.target]) {
            that.counters.helpers[tweet.target] = {
                name: tweet.target,
                helped: [],
                count: 0
            };
        }
        // Don't count multiple "helps"
        else if (that.counters.helpers[tweet.target].helped.indexOf(tweet.user.id) != -1) {
            return;
        }
        that.counters.helpers[tweet.target].helped.push(tweet.user.id);
        that.counters.helpers[tweet.target].count++;
        
        if (!that.counters.helped[tweet.user.id]) {
            that.counters.helped[tweet.user.id] = _.extend({
                count: 0
            }, tweet.user);
        }
        that.counters.helped[tweet.user.id].count++;
        
        tweet.hashtags.forEach(function(tag) {
            var tagLc = tag.toLowerCase();
            if (!that.counters.hashtags[tagLc]) {
                that.counters.hashtags[tagLc] = {
                  name: tag,
                  count: 0
                };
            }
            that.counters.hashtags[tagLc].count++;
        });
    });
    
    this.emit('countersUpdated');
};


module.exports = TwitterReader;