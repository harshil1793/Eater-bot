var restify = require('restify');
var builder = require('botbuilder');
var prompts = require('./prompts');
var locationDialog = require('botbuilder-location');
var Client = require('node-rest-client').Client;
var needle = require('needle'),
    url = require('url'),
    validUrl = require('valid-url'),
    captionService = require('./caption-service');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
   
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    // appId: process.env.MICROSOFT_APP_ID,
    // appPassword: process.env.MICROSOFT_APP_PASSWORD
    appId: '7ee7c6ce-cfe4-401c-817e-76fb4543c85c',
    appPassword: 'fmw2TxiKSRNjaHVVks3Q3LX'
});
var bot = new builder.UniversalBot(connector, function (session) {
    session.beginDialog('rootMenu');
});
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var model = process.env.model;
var LocationKey = "DefaultLocation";
var ShippingStyleKey = "Shipping Style";
var async = require("async");
// var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/fd9a76fa-9d70-47e3-828c-33ef63fa039f?subscription-key=b789414cba8441b89347e424899fa70f');

var entityID = 0;
var ientityID = 0;
var restaurantID = 0;

// bot.recognizer(recognizer);
// bot.library(locationDialog.createLibrary("Ak2VZoOri8R263-z_IAqqGRcG55S3S5q71H9lSkCsU-1gjnHD1KRUkbeI-zLPp5O"));

//root dialog
bot.dialog('start', function(session){
    session.send("Hey! How may I help you today?");
    session.beginDialog('rootMenu');
}).triggerAction({matches: "Greetings"});

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                var reply = new builder.Message()
                    .address(message.address)
                    .text(prompts.welcomeMessage);
                bot.send(reply);
                // var reply = new builder.Message()
                //     .address(message.address)
                //     .text('I also help to find trending restaurants and cafes.');
                // bot.send(reply);
                var reply = new builder.Message()
                    .address(message.address)
                    .text('Type \'help\' to know how bot can help you.');
                bot.send(reply);
            }
        });
    }
});

// Add root menu dialog
bot.dialog('rootMenu', [
    function (session) {
        builder.Prompts.choice(session, "Hey! How may I help you today?", 'Breakfast|Lunch|Dinner|Cafes|Search|Quit',{listStyle:3});
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.userData.category = 'breakfast';
                session.beginDialog('cityList');
                break;
            case 1:
                session.userData.category = 'lunch';
                session.beginDialog('cityList');
                break;
            case 2:
                session.userData.category = 'dinner';
                session.beginDialog('cityList');
                break;
            case 3:
                session.userData.category = 'cafes';
                session.beginDialog('cityList');
                break;
            case 4:
                session.beginDialog('search');
                break;
            case 5:
                session.beginDialog('Quit');
                break;
            default:
                session.endDialog();
                break;
        }
    }
    
    // function (session) {
    //     // Reload menu
    //     session.replaceDialog('rootMenu');
    // }
]).reloadAction('showMenu', null, { matches: /^(menu|back)/i }).triggerAction({ matches: /^menu/i });;


// Add help dialog
bot.dialog('help', function (session) {
    session.send(prompts.helpMessage);
}).triggerAction({ matches: /^help/i });

var returnVals = [];
var returnCityId = [];

//Category List
bot.dialog('cityList', [
    // Step 1
    function (session) {
        builder.Prompts.text(session, 'Tell us your city?');
    },
    // Step 2
    function (session, results) {
        if (results.response) {
            var city = results.response;
            async.waterfall([
                        function(callback){
                            var client = new Client();
                            var responseData = [];
                            var args = {
                                // data : JSON.stringify(jsonObject),
                                headers: {"Content-Type": "application/json"}
                            };
                            client.get("https://developers.zomato.com/api/v2.1/cities?q="+city+"&apikey=14fa78b892c33a15a26b6ca9ec09239e", args, function (data, response) {
                                                // parsed response body as js object 
                                                
                                                responseData = data;
                            console.log(responseData);
                                                locations = responseData.location_suggestions;
                                                var locationLength = locations.length;

                                                console.log("lcaotionssssssss:"+locations.length);
                                                if(locationLength > 0){
                                                    if(locationLength >=10){
                                                        locationLength = 10;
                                                    }
                                                for(var i = 0; i < locationLength; i++){
                                                    returnVals[i] = locations[i].name;
                                                    returnCityId[i] = locations[i].id;
                                                };
                                                callback(null, returnVals, returnCityId);
                                            }
                                            else{
                                                session.send(prompts.cityErrorMessage);
                                                session.beginDialog("breakfast");
                                            }
                                            });
                        }, 
                        function(arg1, callback){
                                builder.Prompts.choice(session,"Great, choose a city", returnVals, {listStyle:3});
                                // session.dialogData.returnCityIds = returnVals;
                                // console.log("IMP dataaaaaaaA: "+session.returnCityId[0]);
                        }]);
        }
        else{
            session.send(prompts.cityErrorMessage);
            session.beginDialog("cityList");
        }
    },
    // Step 3
    function (session, results) {
        if (results.response) {
        switch (results.response.index) {
                                case 0:
                                    // var id = JSON.parse(locations[0].id);
                                    // session.send(id);
                                     entityId = locations[0].id;
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 1:
                                     entityId = locations[1].id;
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 2:
                                     entityId = locations[2].id;
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 3:
                                     entityId = locations[3].id;
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 4:
                                     entityId = locations[4].id;
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 5:
                                     entityId = locations[5].id;
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 6:
                                     entityId = locations[6].id;
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 7:
                                     entityId = locations[7].id;
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 8:
                                     entityId = locations[8].id;
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 9:
                                     entityId = locations[9].id;
                                     session.beginDialog("get_restaurants");
                                    break;
                                default:
                                    session.send("Please try again!");
                                    session.beginDialog("cityList");
                                    break;
                                }
        }
        else{
            session.beginDialog("cityList");
        }
    }
]).triggerAction({ matches: /^cityList/i });

// Get Restaurants
bot.dialog('get_restaurants', [
    // Step 1
    function (session) {
            // var restaurants = results.response;
            async.waterfall([
                        function(callback){
                            var client = new Client();
                            var responseData = [];
                            var restaurantName =[], restaurantId = [], cuisines = [], thumb = [], address = [], city = [];
                            console.log("ID::::::::::::::"+ entityId);
                            var args = {
                                headers: {"Content-Type": "application/json"}
                            };
                            client.get("https://developers.zomato.com/api/v2.1/search?entity_id="+entityId+"&entity_type=city&q=="+session.userData.category+"&sort=rating&count=10&apikey=14fa78b892c33a15a26b6ca9ec09239e", args, function (data, response) {
                            responseData = data;
                            console.log(responseData);
                                                restaurantData = responseData.restaurants;
                                                if(restaurantData.length > 0){
                                                    for(var i = 0; i < 10; i++){
                                                        restaurantName[i] = restaurantData[i].restaurant.name;
                                                        restaurantId[i] = restaurantData[i].restaurant.id;
                                                        cuisines[i] = restaurantData[i].restaurant.cuisines;
                                                        thumb[i] = restaurantData[i].restaurant.thumb;
                                                        address[i] = restaurantData[i].restaurant.location.address;
                                                        city[i] = restaurantData[i].restaurant.location.city;
                                                    };
                                                        callback(null, restaurantName, restaurantId, cuisines, thumb, address, city);
                                                }
                                                else{
                                                    session.send(prompts.restaurantErrorMessage);
                                                    session.beginDialog("cityList");
                                                }
                                            });
                        }, 
                        function(arg1, callback){
                                console.log(returnCityId);
                                console.log(restaurantData[0].restaurant.name);
                                var i = 0;
                                var reviews = [], details = "details";
                               var msg = new builder.Message(session);
                                    msg.attachmentLayout(builder.AttachmentLayout.carousel)
                                    element = [];
                                    for(var i = 0; i < 10; i++){
                                        element.push(new builder.HeroCard(session)
                                            .title(restaurantData[i].restaurant.name)
                                            .subtitle(restaurantData[i].restaurant.cuisines)
                                            .text(restaurantData[i].restaurant.location.address+" "+restaurantData[i].restaurant.location.city)
                                            .images([builder.CardImage.create(session, restaurantData[i].restaurant.thumb)])
                                            .buttons([
                                                // builder.CardAction.imBack(session, reviews.push(i), "Reviews")
                                                // builder.CardAction.imBack(session, details=details+"-"+restaurantData[i].restaurant.id, "Details")
                                            ]))
                                    }
                                    msg.attachments(element);
                                    session.send(msg);
                                     builder.Prompts.text(session, prompts.continueMessage); 
                        }]);
    },
    function(session,results){
        if(results.response == 'yes' || results.response == 'yeah'){
            session.beginDialog('search');
        }
        else{
            session.beginDialog('menu');
        }
    }
]).triggerAction({ matches: /^get_restaurants/i });

//cafes
bot.dialog('Cafes', function (session) {
    session.send("Cafes");
}).triggerAction({ matches: /^Cafes/i });

//Quit
bot.dialog('Quit', function (session) {
    session.send("Good bye !");
}).triggerAction({ matches: /^Quit/i });

var qqq;
//Search
bot.dialog('search', function (session) {
        // session.send("Upload a image to search restaurants");
 if (hasImageAttachment(session)) {
        var stream = getImageStreamFromMessage(session.message);
        captionService
            .getCaptionFromStream(stream)
            .then(function (caption) { handleSuccessResponse(session, caption);})
            .catch(function (error) { handleErrorResponse(session, error); });
            
            

    } else {
        var imageUrl = parseAnchorTag(session.message.text) || (validUrl.isUri(session.message.text) ? session.message.text : null);
        if (imageUrl) {
            captionService
                .getCaptionFromUrl(imageUrl)
                .then(function (caption) { handleSuccessResponse(session, caption);})
                .catch(function (error) { handleErrorResponse(session, error); });
        } else {
            session.send('I\'m more of a visual person. Try sending me an image.');
        }
    }
    console.log("query="+session.userData.q);
}).triggerAction({ matches: /^search/i });


//search by query
bot.dialog('queryImage',[ 
 // Step 1
    function (session) {
        if(session.userData.q!=undefined){
            builder.Prompts.text(session, 'Tell us your city?');
        }
    },
    // Step 2
    function (session, results) {
        if (results.response) {
            var icity = results.response;
            async.waterfall([
                        function(callback){
                            var client = new Client();
                            var responseData = [];
                            var args = {
                                headers: {"Content-Type": "application/json"}
                            };
                            client.get("https://developers.zomato.com/api/v2.1/cities?q="+icity+"&apikey=14fa78b892c33a15a26b6ca9ec09239e", args, function (data, response) {
                                responseData = data;
                                console.log(responseData);
                                locations = responseData.location_suggestions;
                                var locationLength = locations.length;
                                console.log("lcaotionssssssss:"+locations.length);
                                    if(locationLength > 0){
                                        if(locationLength >=10){
                                            locationLength = 10;
                                            }
                                        for(var i = 0; i < locationLength; i++){
                                            returnVals[i] = locations[i].name;
                                            returnCityId[i] = locations[i].id;
                                        };
                                        callback(null, returnVals, returnCityId);
                                    }
                                    else{
                                        session.send(prompts.cityErrorMessage);
                                        session.beginDialog("cityList");
                                    }
                            });
                        }, 
                        function(arg1, callback){
                                builder.Prompts.choice(session,"Great, choose a city", returnVals, {listStyle:3});
                                // session.dialogData.returnCityIds = returnVals;
                                // console.log("IMP dataaaaaaaA: "+session.returnCityId[0]);
                        }]);
        }
        else{
            session.send(prompts.cityErrorMessage);
            session.beginDialog("cityList");
        }
    },


function (session, results) {
       if (results.response) {
            switch (results.response.index) {
                                case 0:
                                     ientityId = locations[0].id;
                                     session.beginDialog("queryRestaurant");
                                    break;
                                case 1:
                                     ientityId = locations[1].id;
                                     session.beginDialog("queryRestaurant");
                                    break;
                                case 2:
                                     ientityId = locations[2].id;
                                     session.beginDialog("queryRestaurant");
                                    break;
                                case 3:
                                     ientityId = locations[3].id;
                                     session.beginDialog("queryRestaurant");
                                    break;
                                case 4:
                                     ientityId = locations[4].id;
                                     session.beginDialog("queryRestaurant");
                                    break;
                                case 5:
                                     ientityId = locations[5].id;
                                     session.beginDialog("queryRestaurant");
                                    break;
                                case 6:
                                     ientityId = locations[6].id;
                                     session.beginDialog("queryRestaurant");
                                    break;
                                case 7:
                                     ientityId = locations[7].id;
                                     session.beginDialog("queryRestaurant");
                                    break;
                                case 8:
                                     ientityId = locations[8].id;
                                     session.beginDialog("queryRestaurant");
                                    break;
                                case 9:
                                     ientityId = locations[9].id;
                                     session.beginDialog("queryRestaurant");
                                    break;
                                default:
                                    session.send("Please try again!");
                                    session.beginDialog("search");
                                    break;
                                }
       }
       else{
           session.beginDialog("search");
       }
}]
).triggerAction({ matches: /^queryImage/i });


bot.dialog('queryRestaurant', [
    // Step 1
    function (session) {
            async.waterfall([
                        function(callback){
                            var client = new Client();
                            var responseData = [];
                            var restaurantName =[], restaurantId = [], cuisines = [], thumb = [], address = [], city = [];
                            console.log("ID::::::::::::::"+ ientityId);
                            console.log("ID::::::::::::::"+ session.userData.q);
                            var args = {
                                headers: {"Content-Type": "application/json"}
                            };
                            client.get("https://developers.zomato.com/api/v2.1/search?entity_id="+ientityId+"&entity_type=city&q=="+session.userData.q+"&sort=rating&apikey=14fa78b892c33a15a26b6ca9ec09239e&count=10", args, function (data, response) {
                            responseData = data;
                            console.log(responseData);
                                                restaurantData = responseData.restaurants;
                                                if(restaurantData.length > 0 ){
                                                    for(var i = 0; i < 10; i++){
                                                        restaurantName[i] = restaurantData[i].restaurant.name;
                                                        restaurantId[i] = restaurantData[i].restaurant.id;
                                                        cuisines[i] = restaurantData[i].restaurant.cuisines;
                                                        thumb[i] = restaurantData[i].restaurant.thumb;
                                                        address[i] = restaurantData[i].restaurant.location.address;
                                                        city[i] = restaurantData[i].restaurant.location.city;
                                                    };
                                                        callback(null, restaurantName, restaurantId, cuisines, thumb, address, city);
                                                }
                                                else{
                                                    session.send(prompts.restaurantErrorMessage);
                                                    session.beginDialog("queryImage");
                                                }
                                            });
                        }, 
                        function(arg1, callback){
                                console.log(returnCityId);
                                console.log(restaurantData[0].restaurant.name);
                                var i = 0;
                                var reviews = [], details = "details";
                               var msg = new builder.Message(session);
                                    msg.attachmentLayout(builder.AttachmentLayout.carousel)
                                    element = [];
                                    for(var i = 0; i < 10; i++){
                                        element.push(new builder.HeroCard(session)
                                            .title(restaurantData[i].restaurant.name)
                                            .subtitle(restaurantData[i].restaurant.cuisines)
                                            .text(restaurantData[i].restaurant.location.address+" "+restaurantData[i].restaurant.location.city)
                                            .images([builder.CardImage.create(session, restaurantData[i].restaurant.thumb)])
                                            .buttons([
                                                // builder.CardAction.imBack(session, reviews.push(i), "Reviews")
                                                // builder.CardAction.imBack(session, details=details+"-"+restaurantData[i].restaurant.id, "Details")
                                            ]))
                                    }
                                    msg.attachments(element);
                                    session.send(msg);
                                    
                        builder.Prompts.text(session, prompts.continueMessage); 
                        }]);
    },
    function(session,results){
        if(results.response == 'yes' || results.response == 'yeah'){
            session.beginDialog('search');
        }
        else{
            session.beginDialog('menu');
        }
    }]
).triggerAction({ matches: /^queryRestaurant/i });


//Image handling methods
function hasImageAttachment(session) {
    return session.message.attachments.length > 0 &&
        session.message.attachments[0].contentType.indexOf('image') !== -1;
}

function getImageStreamFromMessage(message) {
    var headers = {};
    var attachment = message.attachments[0];
    if (checkRequiresToken(message)) {
        connector.getAccessToken(function (error, token) {
            var tok = token;
            headers['Authorization'] = 'Bearer ' + token;
            headers['Content-Type'] = 'application/octet-stream';

            return needle.get(attachment.contentUrl, { headers: headers });
        });
    }

    headers['Content-Type'] = attachment.contentType;
    return needle.get(attachment.contentUrl, { headers: headers });
}

function checkRequiresToken(message) {
    return message.source === 'skype' || message.source === 'msteams';
}

/**
 * Gets the href value in an anchor element.
 * Skype transforms raw urls to html. Here we extract the href value from the url
 * @param {string} input Anchor Tag
 * @return {string} Url matched or null
 */
function parseAnchorTag(input) {
    var match = input.match('^<a href=\"([^\"]*)\">[^<]*</a>$');
    if (match && match[1]) {
        return match[1];
    }

    return null;
}

function handleSuccessResponse(session, caption) {
    if (caption) {
        session.send('I think it\'s ' + caption);
        session.userData.q = caption
        session.beginDialog('queryImage');
    }
    else {
        session.send('Couldn\'t find a caption for this one');
    }

}

function handleErrorResponse(session, error) {
    session.send('Oops! Something went wrong. Try again later.');
    console.error(error);
}