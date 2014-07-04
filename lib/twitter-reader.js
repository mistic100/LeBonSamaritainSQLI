var config = require('../config'),
    twitter = require('twitter'),
    //twitter = require('./twitter-mock'),
    log = require('./log')('TwitterReader'),
    mongodb = require('mongodb').MongoClient,
    util = require('util'),
    _ = require('underscore'),
    moment = require('moment'),
    EventEmitter = require('events').EventEmitter;


var TwitterReader = function() {
    this.client = new twitter(config.twitter);

    this.collections = {
        statuses: null
    };
    
    this.counters = {
        helpers: {},
        helped: {},
        hashtags: {}
    };
};

util.inherits(TwitterReader, EventEmitter);


TwitterReader.prototype.formatDate = function(date) {
    return moment(date, 'ddd MMM DD HH:mm:ss ZZ YYYY', 'en').toDate();
};

TwitterReader.prototype.init = function() {
    var that = this;

    mongodb.connect(config.mongoUri, function(err, db) {
        if (err) {
            log.error(err);
            return;
        }
        
        log.info('Init database connection');
        
        that.collections.statuses = db.collection('statuses');
        
        that.getAllTweets(function(tweets) {
            var since_id = tweets[0] ? tweets[0]._id : '0';
            log.info('Last tweet found: '+ since_id);
            
            that.grabOldTweets(since_id);
            
            that.updateCounters(tweets);
        });
        
        that.initStream();
    });
};

TwitterReader.prototype.initStream = function() {
    var that = this;
    
    this.client.stream('filter', {
        track: '#'+config.hashtag
    }, function(stream) {
        stream.on('data', function(data) {
            var tweets = that.filterTweets([data]);
            
            if (tweets.length != 0) {
                log.debug(tweets[0].text);
                that.emit('newTweet', tweets[0]);
            
                that.saveTweets(tweets);
            }
        });
    });
};

TwitterReader.prototype.getAllTweets = function(callback) {
    this.collections.statuses
      .find({
          '_hashtag': config.hashtag,
          'created_at': {
              '$gt': config.startDate,
              '$lt': config.endDate
          }
      })
      .sort({
          '_id': -1
      })
      .toArray(function(err, tweets) {
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
          return config.matcher.test(tweet.text) && !tweet.retweeted_status;
      })
      .map(function(tweet) {
          var hashtags = [];
          if (tweet.entities && tweet.entities.hashtags) {
            hashtags = tweet.entities.hashtags
              .map(function(tag) {
                  return tag.text.toLowerCase();
              })
              .filter(function(tag) {
                  return tag != config.hashtag;
              });
          }
          
          return {
              _id: tweet.id_str,
              _hashtag: config.hashtag,
              created_at: that.formatDate(tweet.created_at),
              text: tweet.text,
              target: tweet.text.match(config.matcher)[1].toLowerCase(),
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
    
    this.client.search('#'+config.hashtag, {
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
    if (tweets.length>0) {
        log.info('Save '+ tweets.length +' tweets');
        
        this.collections.statuses.insert(tweets, function(){});
        
        this.updateCounters(tweets);
    }
};

TwitterReader.prototype.updateCounters = function(tweets) {
    var that = this;
    
    tweets.forEach(function(tweet) {
        if (tweet.created_at < config.startDate || tweet.created_at > config.endDate) {
            return;
        }
        
        if (!that.counters.helpers[tweet.target]) {
            that.counters.helpers[tweet.target] = {
                name: tweet.target,
                helped: [],
                count: 0
            };
        }
        if (that.counters.helpers[tweet.target].helped.indexOf(tweet.user.login) == -1) {
            that.counters.helpers[tweet.target].helped.push(tweet.user.login);
        }
        that.counters.helpers[tweet.target].count++;
        
        if (!that.counters.helped[tweet.user.id]) {
            that.counters.helped[tweet.user.id] = _.extend({
                count: 0,
                helpers: [],
            }, tweet.user);
        }
        if (that.counters.helped[tweet.user.id].helpers.indexOf(tweet.target) == -1) {
            that.counters.helped[tweet.user.id].helpers.push(tweet.target);
        }
        that.counters.helped[tweet.user.id].count++;
        
        tweet.hashtags.forEach(function(tag) {
            if (!that.counters.hashtags[tag]) {
                that.counters.hashtags[tag] = {
                  name: tag,
                  count: 0
                };
            }
            that.counters.hashtags[tag].count++;
        });
    });
    
    this.emit('countersUpdated');
};


module.exports = TwitterReader;