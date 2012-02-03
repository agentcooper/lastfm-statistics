var request = require('request'),
    qs = require('querystring'),
    async = require('async');

var lastfm = {
  timeout: {
    page: [100, 400],
    each: [4000, 5000]
  }
},
api_key = 'b25b959554ed76058ac220b7b2e0a026';

function getRandom(a, b) {
  return Math.floor(Math.random() * (b - a + 1) + a);
}

function getPage(user, artist, page, callback) {
  var params = {
    'method': 'user.getartisttracks',
    'user': user,
    'artist': artist,
    'api_key': api_key,
    'format': 'json',
    'page': page
  }
  
  var options = {
    url: 'http://ws.audioscrobbler.com/2.0/?' + qs.stringify(params),
    method: 'get',
    json: true
  }
  
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      callback && callback({tracks: body.artisttracks, pages: body.artisttracks['@attr'].totalPages});
    } else {
      console.log(error, response.statusCode);
    }
  });
}

lastfm.getTracks = function(user, artist, cb) {
  console.time(artist);
  var tracks = [];
  
  var q = async.queue(function(page, callback) {
    getPage(user, artist, page, function(pagetracks) {
      console.log('Got', page, artist);
      tracks = tracks.concat(pagetracks.tracks.track);
      
      setTimeout(callback, getRandom.apply(this, lastfm.timeout.page));
    });
  }, 5);
  
  q.drain = function() {
    console.timeEnd(artist);
    cb(tracks);
  }
  
  getPage(user, artist, 1, function(pagetracks) {
    console.log('Got 1', artist);
    tracks = tracks.concat(pagetracks.tracks.track);
    
    if (pagetracks.pages == 1) {
      cb(tracks);
    } else {
      for (var i = 2; i <= pagetracks.pages; i++) q.push(i);
    }
  });
}

lastfm.getMonthlyStats = function(user, artist, callback) {
  var stat = {};
  lastfm.getTracks(user, artist, function(tracks){
    tracks.forEach(function(track) {
      var d = new Date(track.date.uts * 1000),
          hash = +new Date(d.getFullYear(), d.getMonth(), 0);

      if (stat[hash]) {
        stat[hash] += 1;
      } else {
        stat[hash] = 1;
      }
    });
    
    callback && callback({artist: tracks[0].artist['#text'], statistics: stat, username: user});
  });
}

lastfm.getMultipleStats = function(data, callback) {
    var res = {
        statistics: {},
        data: []
    },
    all = res.statistics;
    
    function hash(a, b) { return escape(a) + '|' + escape(b); }
    
    async.forEachLimit(data, 1, function(item, cont) {
      lastfm.getMonthlyStats(item.username, item.artist, function(stat){
        console.log("Got %s's monthly stats for %s", stat.username, stat.artist);
        
        res.data.push({username: stat.username, artist: stat.artist});

        for (k in stat.statistics) {
            if (!all[k]) all[k] = {};
            all[k][hash(stat.username, stat.artist)] = stat.statistics[k];
        }
        
        setTimeout(cont, getRandom.apply(this, lastfm.timeout.each));
      });
      
    }, function() {
        // aggregate
        
        for (k in all) {
            var m = [];
            res.data.forEach(function(ak) {
                m.push(all[k][hash(ak.username, ak.artist)] || 0);
            });
            all[k] = m.slice(0);
        }
        
        callback(res);
    });
}

module.exports = lastfm;