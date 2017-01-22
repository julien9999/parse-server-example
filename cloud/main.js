function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}

Parse.Cloud.afterSave("_User", function(request, response) {
    if (request.object.original) {
    	request.object.set("kitcode",randomString(4) + randomString(4,"0123456789"));
    	response.success();
    }
});



Parse.Cloud.define("sendemail", function(request, response) {
    var body = request.params.raison +
            	"\n\nMerci,\n" +
            	"L'équipe de KITapp";
            	
Parse.Cloud.httpRequest({
   			method: 'POST',
  			url: 'http://appstesting.fr/sendmail2.php',
  			body: {
			"emailto":request.params.emailto,
			"object":request.params.object,
			"message":body,
  			}
    }).then(function(httpResponse) {
      console.log(httpResponse);
      response.success(httpResponse.text);
    }, function(err) {
      console.log(err);
      response.error(err);
    });

});

//Cas n°1- Personne ne se connait, personne n'a fait de demande a l'autre 
//         A demande a B, A et B ne se connaissent pas

//Cas n°2- J'ai fait une demande, l'autre non
//         B demande a A, A a deja fait une demande

//Cas n°3- J'ai fait une demande, l'autre aussi
//         A a demandé a B, B demande a A

 function pointerTo(objectId, klass) {
    return { __type:"Pointer", className:klass, objectId:objectId };
}
Parse.Cloud.define("AddRelationship", function(request, response) {
	var AaskedB;
	var BaskedA;
	
	var resultsA;
	var resultsB;
	
//Cas n°1- Personne ne se connait, personne n'a fait de demande a l'autre
    var query = new Parse.Query("relationships");
    query.equalTo("userObjectid",request.params.userObjectid)
    query.equalTo("friendObjectid",request.params.friendObjectid)
    
    var query2 = new Parse.Query("relationships");
    query2.equalTo("userObjectid",request.params.friendObjectid)
    query2.equalTo("friendObjectid",request.params.userObjectid)
 
       
    query.find({
		success: function(results) {
            if(results.length>0){// A a deja fait une demande  
            	AaskedB="true";   
            	resultsA=results;          	         
            }
            else{ // A n'a pas fait de demande
             	AaskedB="false"; 
             	resultsA=results;          	         
           }
		
    		query2.find({
				success: function(results) {
           			if(results.length>0){// B a deja fait une demande  
            			BaskedA="true";          
             			resultsB=results;            	                    
            		}
            		else{ // B n'a pas fait de demande
            			BaskedA="false";
             			resultsB=results;            	                    
            		}

	
	if((AaskedB==="false")&&(BaskedA==="false")){	//Jai jamais demandé et l'autre non plus== je fais ma demande
                         var GameScore = Parse.Object.extend("relationships");
                         var reservation = new GameScore({
                            "shared":request.params.shared,
                            "userObjectid":request.params.userObjectid,
                            "friendObjectid":request.params.friendObjectid,
                            "userPointer":pointerTo(request.params.userObjectid, "_User"),
                            "friendPointer":pointerTo(request.params.friendObjectid, "_User"),
                            "accepted":false,
                         });
                         reservation.save(null, {
                            success: function(reservation,success) {
                                //response.success(request.params.name+ " a recu une invitation de votre part.");
                                response.success("firstType");
                            
                            },
                            error: function(reservation, error) {
 //                               response.error(error);
                            }
                         });	
	}
	
	if((AaskedB==="false")&&(BaskedA==="true")){	//Jai jamais demandé et l'autre ma deja demandé== les deux demandes sont acceptées
		//On accepte la demande de B
		var query3 = new Parse.Query(Parse.Object.extend("relationships"));
    		query3.equalTo("userObjectid",request.params.friendObjectid)
    		query3.equalTo("friendObjectid",request.params.userObjectid)
			query3.first({
  				success: function(object) {
     				object.set("accepted", true);
    				object.save();

        			//on crée la demande acceptée de A
                         var GameScore = Parse.Object.extend("relationships");
                         var reservation = new GameScore({
                            "shared":request.params.shared,
                            "userObjectid":request.params.userObjectid,
                            "friendObjectid":request.params.friendObjectid,
                            "userPointer":pointerTo(request.params.userObjectid, "_User"),
                            "friendPointer":pointerTo(request.params.friendObjectid, "_User"),
                            "accepted":true,
                         });
                         reservation.save(null, {
                            success: function(reservation,success) {
                                response.success("secondType");
                                //response.success(request.params.name+ " fait desormais partis de vos amis.");
                            },
                            error: function(reservation, error) {
 //                               response.error(error);
                            }
                         });
  				},
  				error: function(error) {
    				alert("Error: " + error.code + " " + error.message);
  				}
			});          	            	
	}
	
	if((AaskedB==="true")&&(BaskedA==="false")){	//Jai deja demandé et l'autre ma jamais demandé== les deux demandes sont acceptées
   		response.success(request.params.name+ " a déjà reçu une invitation de votre part.");	
	}
	
	if((AaskedB==="true")&&(BaskedA==="true")){	//Jai deja demandé et l'autre ma deja demandé== les deux demandes sont acceptées
   		response.success("Vous êtes déjà amis avec "+request.params.name);		
	}
	
				},
        		error: function() {
        			response.error("Une erreur s'est produite.");
        		}
			});
			
		},
        error: function() {
        	response.error("Une erreur s'est produite.");
        }
	});

    
		
});

Parse.Cloud.define("deleterelationships", function(request, response) {
    var query = new Parse.Query("relationships");
    query.equalTo("userObjectid",request.params.me)
    query.equalTo("friendObjectid",request.params.friend)
    
    var query2 = new Parse.Query("relationships");
    query2.equalTo("userObjectid",request.params.friend)
    query2.equalTo("friendObjectid",request.params.me)

  query.find().then(function(comments) {
    return Parse.Object.destroyAll(comments);
  }).then(function(success) {
    // The related comments were deleted
 query2.find().then(function(comments) {
    return Parse.Object.destroyAll(comments);
  }).then(function(success) {
    // The related comments were deleted
            response.success("success");
  }, function(error) {
        	response.error("Une erreur s'est produite.");
  });    
  }, function(error) {
        	response.error("Une erreur s'est produite.");
  });    
    
});


Parse.Cloud.define("luoupasChat", function(request, response) {
    var query = new Parse.Query("chat");
    query.equalTo("objectId",request.params.objectId)

  query.first().then(function(object) {
            var messages =object.get('userMessages2');
            
	   		for (var i = 0; i < messages.length; i++) {
				if (messages[i].objectId!=request.params.me && !messages[i].luoupas) {		
					messages[i].luoupas=true;
				};
			}         
    		object.set('userMessages2', messages);
    		object.set('updatedAt', request.params.updatedAt);
            object.save();              
  }).then(function(success) {
  	response.success("success");
  }, function(error) {
    response.error("Une erreur s'est produite.");
  });      	
});


Parse.Cloud.define("blockperson", function(request, response) {
var GameScore = Parse.Object.extend("_User");
var query = new Parse.Query(GameScore);
query.equalTo("objectId", request.params.me);

var query2 = new Parse.Query(GameScore);
query2.equalTo("objectId", request.params.friend);

    query.first({
        useMasterKey: true, 
        success:function(userData){
            console.log("before save");
    	    userData.addUnique("iblock",pointerTo(request.params.friend, "_User"));
            userData.save(null, { useMasterKey: true });

		    query2.first({
		        useMasterKey: true, 
		        success:function(userData){
		            console.log("before save");
		    	    userData.addUnique("blockedby",pointerTo(request.params.me, "_User"));
		            userData.save(null, { useMasterKey: true });
		            response.success();
		        },
		        error: function(error){
		            response.error(error);
		        }
		    });
        },
        error: function(error){
            response.error(error);
        }
    });
});




Parse.Cloud.define("unblockperson", function(request, response) {
var GameScore = Parse.Object.extend("_User");
var query = new Parse.Query(GameScore);
query.equalTo("objectId", request.params.me);

var query2 = new Parse.Query(GameScore);
query2.equalTo("objectId", request.params.friend);

    query.first({
        useMasterKey: true, 
        success:function(userData){
	    	userData.remove("iblock",pointerTo(request.params.friend, "_User"));
	        userData.save(null, { useMasterKey: true });

		    query2.first({
		        useMasterKey: true, 
		        success:function(userData){
			    	userData.remove("blockedby",pointerTo(request.params.me, "_User"));
			        userData.save(null, { useMasterKey: true });
				response.success();
		        },
		        error: function(error){
		            response.error(error);
		        }
		    });
        },
        error: function(error){
            response.error(error);
        }
    });
    

});
