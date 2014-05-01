$(document).bind('pageinit', function() {
  
  $.ajaxSetup ({
    cache: false
  });

  //Facebook login button, redirects to #mainpage if connected
  $(".FB-login").bind("click", function(event, ui){
 
    FB.login(function(response) {
        if (response.status === 'connected') {
            $.mobile.changePage($("#mainpage"));
        } else {
            alert('Unable to login');
        }
    },{ scope: "email" });
  });

  //Facebook logout button, redirects to #login screen
  $(".FB-logout").bind("click", function(event, ui){
    FB.logout(function(response){
      $.mobile.changePage($("#login"));
    });
  });

  //Slider button to report page, checks person is logged into Facebook
  $(".report-button").bind("click", function(event, ui){
    
    FB.getLoginStatus(function(response){
        if (response.status === 'connected') {
            $.mobile.changePage($("#mainpage"));
        } else {
            $.mobile.changePage($("#login"));
        }
    });
  });

  //Button for reporting pests
  $( "#send-report" ).bind( "click", function(event, ui) {

    //Show loading image
    $.mobile.loading( "show");

    //Check user is logged into Facebook
    FB.getLoginStatus(function(response){
        if (response.status === 'connected') {
            
          navigator.geolocation.getCurrentPosition(onSuccess, onError);

        } else {
            alert("Not logged in");
            $.mobile.changePage($("#login"));
        }
    });

    $.mobile.loading("hide");
    
/*
    alert("Sending report");
    var jsonUrl = "http://judas.herokuapp.com/pestspotted";
    var newQuote = { "author" : author, "text" : quote };
    $.post(jsonUrl,newQuote, function(data) {
      alert("Added quote number " + data.pos + " " + data.author + " " + data.text);
    }, 'json');*/
  });

});