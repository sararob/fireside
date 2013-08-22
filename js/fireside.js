    //Create references to the question data
    var fbaseRef = new Firebase("fireside.firebaseIO.com/");
    var usersRef = fbaseRef.child('users');
    var questionRef = fbaseRef.child('questions');
    var repliesRef = fbaseRef.child('replies');

    //Log users in
   
   var loginButton = $('#login-btn');
   loginButton.click(function (e) {
        e.preventDefault();
        loginButton.css("visibility", "hidden");
        auth.login('twitter');
   });

   var auth = new FirebaseSimpleLogin(fbaseRef, function(error, user) {
       if (error) {
           //an error occurred while attempting login
           console.log(error);

       } else if (user) {
           //user authenticated with Firebase
           console.log('User ID: ' + user.id + ', Provider: ' + user.provider);
           $('<div/>').text("Signed in as @" + user.username).appendTo($('#signed-in'));
           $('#login-btn').css("visibility", "hidden");
           $('#signed-in').css("visibility", "visible");
       } else {
           //user is logged out
       }
   });


    //When questions are asked, write data to firebase
    $('#questionInput').keypress(function (e) {
        if(e.keyCode == 13) {
            var question = $('#questionInput').val();
            var replies = {
                reply1: true
            };
            questionRef.push({question:question, replies: replies});
            $('#questionInput').val('');
        }
    });

    //Callback that displays the new question with a reply field
    questionRef.limit(10).on('child_added', function (snapshot) {
        var q = snapshot.val();
        $('<div/>').text(q.question).attr({'class': 'question'}).appendTo($('#questionsDiv'));
        $('<input/>').attr({'type':'text', 'placeholder':'Add an answer', 'class':'reply'}).appendTo($('#questionsDiv'));
        $('<button/>').attr({'class':'add-reply'}).text('Reply').appendTo($('#questionsDiv'));
        $('<hr/>').appendTo('#questionsDiv');

        //Handle replies
        $('.reply').keypress(function (e) {
            if (e.keyCode == 13) {
                var reply = $(this).closest('input').val();
                //alert(reply);
                //Write this reply to the firebase for the question it's referencing
        };
    });
    });