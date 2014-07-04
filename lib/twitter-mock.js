var moment = require('moment'),
    EventEmitter = require('events').EventEmitter;


var helpers  = [
    'dsorel', 'asaubinneau', 'kgarrido', 'rgirodon', 'nmoret', 'scarrillon'
];

var helped = [
    {id_str: '1111', screen_name: 'dsorel', name: 'Damien Sorel', profile_image_url: 'http://a0.twimg.com/sticky/default_profile_images/default_profile_6_normal.png' },
    {id_str: '2222', screen_name: 'asaubinneau', name: 'Anne-Sophie', profile_image_url: 'http://a0.twimg.com/sticky/default_profile_images/default_profile_6_normal.png' },
    {id_str: '3333', screen_name: 'kgarrido', name: 'Kévin Keihn', profile_image_url: 'http://a0.twimg.com/sticky/default_profile_images/default_profile_6_normal.png' },
    {id_str: '4444', screen_name: 'rgirodon', name: 'Rémy G', profile_image_url: 'http://a0.twimg.com/sticky/default_profile_images/default_profile_6_normal.png' },
    {id_str: '5555', screen_name: 'nmoret', name: 'Nicolas Moret', profile_image_url: 'http://a0.twimg.com/sticky/default_profile_images/default_profile_6_normal.png' },
    {id_str: '6666', screen_name: 'scarrillon', name: 'Sca-scarrillon', profile_image_url: 'http://a0.twimg.com/sticky/default_profile_images/default_profile_6_normal.png' }
];


var twitter = twitter = function(config) {};


twitter.prototype.stream = function(query, options, callback) {
    var stream = new EventEmitter();
    
    setInterval(function() {
        stream.emit('data', {
            id_str: new Date().getTime().toString(10),
            text: 'Merci '+ helpers[Math.floor(Math.random()*helpers.length)] + ' pour les chips #swag',
            created_at: moment().format('ddd MMM DD HH:mm:ss ZZ YYYY'),
            user: helped[Math.floor(Math.random()*helped.length)]
        });
    }, 1000*60);

    callback(stream);
};

twitter.prototype.search = function(query, options, callback) {};


module.exports = twitter;