var restify = require('restify');
var builder = require('botbuilder');
var prompts = require('./prompts');
var locationDialog = require('botbuilder-location');
var Client = require('node-rest-client').Client;

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
   
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    // appId: process.env.MICROSOFT_APP_ID,
    // appPassword: process.env.MICROSOFT_APP_PASSWORD
    appId: 'caaeba19-1014-4335-8fef-fc9bf026661f',
    appPassword: '6QQeVWnyUSgYvfn7dQo8MEi'
});
var bot = new builder.UniversalBot(connector, function (session) {
    // session.send("%s, I heard: %s", session.userData.name, session.message.text);
    // session.send("Say 'help' or something else...");
    session.send("Welcome to the Eater Bot.");
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

// bot.recognizer(recognizer);
// bot.library(locationDialog.createLibrary("Ak2VZoOri8R263-z_IAqqGRcG55S3S5q71H9lSkCsU-1gjnHD1KRUkbeI-zLPp5O"));

//root dialog
bot.dialog('start', function(session){
    // session.send("Hey! How may I help you today?");
    session.beginDialog('rootMenu');
}).triggerAction({matches: "Greetings"});

// Add root menu dialog
bot.dialog('rootMenu', [
    function (session) {
        builder.Prompts.choice(session, "Hey! How may I help you today?", 'Breakfast|Lunch|Dinner|Cafes|Quit',{listStyle:3});
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.beginDialog('breakfast');
                break;
            case 1:
                session.beginDialog('lunch');
                break;
            case 2:
                session.beginDialog('dinner');
                break;
            case 3:
                session.beginDialog('cafes');
                break;
            case 4:
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
]).reloadAction('showMenu', null, { matches: /^(menu|back)/i });


// Add help dialog
bot.dialog('help', function (session) {
    session.send("help");
}).triggerAction({ matches: /^help/i });

var returnVals = [];
var returnCityId = [];
//Breakfast
bot.dialog('breakfast', [
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
                                                session.send("Not able to find City. Please enter again");
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
            session.send("Not able to find City. Please enter again");
            session.beginDialog("breakfast");
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
                                    session.send("Great!");
                                    // session.beginDialog("shipment");
                                    break;
                                }
        }
    }
]).triggerAction({ matches: /^breakfast/i });

//Get Cities

bot.dialog('get_cities', [
    function (session) {
                    async.waterfall([
                        function(callback){
                            var client = new Client();
                            var responseData = [];
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["AddressLine"] = place.streetAddress;
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["PoliticalDivision1"] = place.region;
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["PostcodePrimaryLow"] = place.postalCode;
                            q="new york";
                            // console.log("ID:"+ session.dialogData.entityId);
                            var args = {
                                // data : JSON.stringify(jsonObject),
                                headers: {"Content-Type": "application/json"}
                            };
                            client.get("https://developers.zomato.com/api/v2.1/cities?q="+q+"newyork&apikey=14fa78b892c33a15a26b6ca9ec09239e", args, function (data, response) {
                                                // parsed response body as js object 
                                                
                                                responseData = data;
                            console.log(responseData);
                                                
                                                dropLocations = responseData.location_suggestions;
                                                for(var i = 0; i < 5; i++){
                                                    returnVals[i] = dropLocations[i].name;
                                                };
                                                callback(null, returnVals);
                                            });
                        }, 
                        function(arg1, callback){
                                builder.Prompts.choice(session,"Which address do you want to select", returnVals, {listStyle:3});
                        }]);
    },
    function (session, results) {
        session.endDialog('Hello %s!', results.response);
    }
]).triggerAction({ matches: /^greetings/i });


// Get Restaurants
bot.dialog('get_restaurants', [
    // Step 1
    function (session) {
            // var restaurants = results.response;
            async.waterfall([
                        function(callback){
                            var client = new Client();
                            var responseData = [];
                            var restaurantName =[], restaurantId = [], cuisines = [], thumb = [], address = [], city = [] ;
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["AddressLine"] = place.streetAddress;
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["PoliticalDivision1"] = place.region;
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["PostcodePrimaryLow"] = place.postalCode;
                            // q="new york";
                            console.log("ID::::::::::::::"+ entityId);
                            var args = {
                                // data : JSON.stringify(jsonObject),
                                headers: {"Content-Type": "application/json"}
                            };
                            client.get("https://developers.zomato.com/api/v2.1/search?entity_id="+entityId+"&entity_type=city&collection_id=1&apikey=14fa78b892c33a15a26b6ca9ec09239e", args, function (data, response) {
                            responseData = data;
                            console.log(responseData);
                                                
                                                restaurantData = responseData.restaurants;
                                                for(var i = 0; i < 10; i++){
                                                    restaurantName[i] = restaurantData[i].restaurant.name;
                                                    restaurantId[i] = restaurantData[i].restaurant.id;
                                                    cuisines[i] = restaurantData[i].restaurant.cuisines;
                                                    thumb[i] = restaurantData[i].restaurant.thumb;
                                                    address[i] = restaurantData[i].restaurant.location.address;
                                                    city[i] = restaurantData[i].restaurant.location.city;
                                                };
                                                callback(null, restaurantName, restaurantId, cuisines, thumb, address, city);
                                            });
                        }, 
                        function(arg1, callback){
                                // builder.Prompts.choice(session,"Great, choose a city", returnVals, {listStyle:3});
                                console.log(returnCityId);
                                console.log(restaurantData[0].restaurant.name);
                                var i = 0;
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
                                                builder.CardAction.imBack(session, "buy classic white t-shirt", "Buy")
                                            ]))
                                    }
                                    msg.attachments(
                                        element
                                    );
                                    session.send(msg);
                                // session.dialogData.returnCityIds = returnVals;
                                // console.log("IMP dataaaaaaaA: "+session.returnCityId[0]);
                        }]);
    },
    // Step 3
    function (session, results) {
        if (results.response) {
        switch (results.response.index) {
                                case 0:
                                    // var id = JSON.parse(locations[0].id);
                                    // session.send(id);
                                    session.dialogData.entityId = locations[0].id;
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 1:
                                    session.send(locations[1].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 2:
                                    session.send(locations[2].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 3:
                                    session.send(locations[3].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 4:
                                    session.send(locations[4].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 5:
                                    session.send(locations[5].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 6:
                                    session.send(locations[6].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 7:
                                    session.send(locations[7].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 8:
                                    session.send(locations[8].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 9:
                                    session.send(locations[9].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                default:
                                    session.send("Great!");
                                    // session.beginDialog("shipment");
                                    break;
                                }
        }
        session.endDialog('Hello %s!', results.response.index);
    }
]).triggerAction({ matches: /^get_restaurants/i });




//Lunch
bot.dialog('Lunch', function (session) {
    session.send("Lunch");
    session.send("ending %s",session.userData.type)
}).triggerAction({ matches: /^Lunch/i });

//Dinner
bot.dialog('Dinner', function (session) {
    session.send("Dinner");
    session.send("ending %s",session.userData.type)
}).triggerAction({ matches: /^Dinner/i });


//cafes
bot.dialog('Cafes', function (session) {
    session.send("Cafes");
}).triggerAction({ matches: /^Cafes/i });

//Search
bot.dialog('search', [
    function (session) {
        builder.Prompts.choice(session, "What are you looking for?", 'Search by zone|Search by Image|Quit',{listStyle:3});
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.beginDialog('breakfast');
                break;
            case 1:
                session.beginDialog('Lunch');
                break;
            case 2:
                session.beginDialog('Dinner');
                break;
            case 2:
                session.beginDialog('Cafes');
                break;
            default:
                session.endDialog();
                break;
        }
    },
    function (session) {
        // Reload menu
        session.replaceDialog('rootMenu');
    }
]).reloadAction('showMenu', null, { matches: /^(search)/i });

//Quit
bot.dialog('Quit', function (session) {
    session.send("Good bye !");
}).triggerAction({ matches: /^Quit/i });
