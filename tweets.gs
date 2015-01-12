/* 

T W I T T E R   A R C H I V E R   
- - - - - - -   - - - - - - - - 

Written by Amit Agarwal www.ctrlq.org 

Tutorial : http://www.labnol.org/?p=6505

YouTube  : https://www.youtube.com/watch?v=sjRTSkBHnyo

*/


var TWITTER_CONSUMER_KEY    =  "your CONSUMER KEY";

var TWITTER_CONSUMER_SECRET =  "your CONSUMER SECRET";


/* Upgrade to Twitter Archiver PREMIUM - It's faster, allows you to track multiple hashtags and can even capture old tweets posted in the last 6-9 days */

/* Available at http://www.labnol.org/internet/save-twitter-hashtag-tweets/6505/#premium */

/* If you would like to customize the Twitter Archive, visit ctrlq.org */

/* It's all technical down there - @labnol */














function logTweet_(sheet, tweet) {
  
  var log = [];
  
  log.push(new Date(tweet.created_at));
  log.push('=HYPERLINK("https://twitter.com/' 
           + tweet.user.screen_name + '/status/' + tweet.id_str + '","' + tweet.user.name + '")');
  log.push(tweet.user.followers_count);
  log.push(tweet.user.friends_count);
  log.push(tweet.retweet_count);
  log.push(tweet.favorite_count);
  log.push(tweet.text.replace(/\r\n|\n|\r/g, " ").replace("&lt;", "<").replace("&gt;", ">"));
  
  if (tweet.geo) {
    log.push(tweet.geo.coordinates[0]);
    log.push(tweet.geo.coordinates[1]);
  }
  else {
    log.push('');
    log.push('');
  }
  sheet.insertRowBefore(3).getRange("A3:I3").setValues([log]);
}


function encodeString_(q) {
  var str =  encodeURIComponent(q);
  str = str.replace(/!/g,'%21');
  str = str.replace(/\*/g,'%2A');
  str = str.replace(/\(/g,'%28');
  str = str.replace(/\)/g,'%29');
  str = str.replace(/'/g,'%27');
  return str;
}


function oAuth_() {
  
  var oauthConfig = UrlFetchApp.addOAuthService("twittersearch");
  oauthConfig.setAccessTokenUrl("https://api.twitter.com/oauth/access_token");
  oauthConfig.setRequestTokenUrl("https://api.twitter.com/oauth/request_token");
  oauthConfig.setAuthorizationUrl("https://api.twitter.com/oauth/authorize");
  oauthConfig.setConsumerKey(TWITTER_CONSUMER_KEY);
  oauthConfig.setConsumerSecret(TWITTER_CONSUMER_SECRET);
  
}


function authorizeTwitter_() {
  
  try {
    
    var api  = "https://api.twitter.com/1.1/application/rate_limit_status.json?resources=search";
    
    var options =  {
      "method": "get",
      "oAuthServiceName":"twittersearch",
      "oAuthUseToken":"always"
    };
    
    oAuth_();
    
    var result = UrlFetchApp.fetch(api, options);   
    
    if ( result.getResponseCode() == 200 )
      return true;
    
  } catch (e) {
    Logger.log(e.toString());
  }
  
  return false;
  
}




function Initialize() {
  
  try {
    
    var tweet_text, sinceID, maxID, api, sheet, search;
    var options, result, json, tweets, tweet, sender;
    
    Stop();
    
    if ( authorizeTwitter_() ) {
      
      sheet = SpreadsheetApp.getActiveSheet();
      search = sheet.getName();
      
      options =  {
        "method": "get",
        "oAuthServiceName":"twittersearch",
        "oAuthUseToken":"always"
      };
      
      oAuth_();
      
      api  = "https://api.twitter.com/1.1/search/tweets.json?count=50&include_entities=false"; 
      api += "&result_type=recent&q=" + encodeString_(search);
      
      result = UrlFetchApp.fetch(api, options);   
      
      if (result.getResponseCode() == 200) {
        
        json = JSON.parse(result.getContentText());
        
        if (json) {
          
          tweets = json.statuses;
          
          doProperty_("SINCEID", tweets[0].id_str);
          doProperty_("MAXID", tweets[tweets.length-1].id_str);
          
          for (var i=tweets.length-1; i>=0; i--) {
            logTweet_(sheet, tweets[i]);
          }
          
        }
      }
      
      ScriptApp.newTrigger("saveTweets")
      .timeBased().everyMinutes(15).create();
      
    }    
    
  } catch (e) {
    Logger.log(e.toString());
  }
}

function Clear() { 
  var sheet = SpreadsheetApp.getActiveSheet();
  sheet.getRange("A3:G" + (sheet.getLastRow() > 3 ? sheet.getLastRow() : "3")).clear();
  Stop();
}

function saveTweets() {
  
  var tweet_text, sinceID, maxID, api, sheet, search;
  var options, result, json, tweets, tweet, sender;
  
  try {
    
    sheet = SpreadsheetApp.getActiveSheet();
    search = sheet.getName();
    
    sinceID = doProperty_("SINCEID");
    
    options =  {
      "method": "get",
      "oAuthServiceName":"twittersearch",
      "oAuthUseToken":"always"
    };
    
    oAuth_();
    
    api  = "https://api.twitter.com/1.1/search/tweets.json?count=50&include_entities=false"; 
    api += "&result_type=recent&q=" + encodeString_(search) + "&since_id=" + sinceID;
    
    result = UrlFetchApp.fetch(api, options);   
    
    if (result.getResponseCode() == 200) {
    
      json = JSON.parse(result.getContentText());

      if (json) {
        
        tweets = json.statuses;
        
        if (tweets.length) {
          doProperty_("SINCEID", tweets[0].id_str);
        }
        
        for (var i=tweets.length-1; i>=0; i--) {
          logTweet_(sheet, tweets[i]);
        }
      }
    }
  }    
  catch (e) {
    Logger.log(e.toString());
  }
}

function doProperty_(key, value) {
  
  var properties = PropertiesService.getScriptProperties();
  
  if (value) {
    properties.setProperty(key, value);
  } else {
    return properties.getProperty(key) || "";
  }
  
}

function Stop() {
  var triggers = ScriptApp.getScriptTriggers();
  for(var i=0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  doProperty_("SINCEID", "");  
  doProperty_("MAXID", "");
}
