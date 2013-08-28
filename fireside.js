$(function() {
    // Create references to the questions, replies, and user data
    var fbaseRef = new Firebase("fireside.firebaseIO.com/");
    var usersRef = fbaseRef.child('users');
    var questionRef = fbaseRef.child('questions');
    var repliesRef = fbaseRef.child('replies');
    var repliesQuestionsRef = fbaseRef.child('questions').child('replies');
    var username = null;

    //Firebase Simple Login using twitter
    var auth = new FirebaseSimpleLogin(fbaseRef, function(error, user) {
        if (error) {
            //an error occurred while attempting login
            console.log(error);

        } else if (user) {
            //user authenticated with Firebase
            console.log('User ID: ' + user.id + ', Provider: ' + user.provider);
            username = user.username;
            $('<div/>').text("Signed in as @" + username).appendTo($('#signed-in'));
            $('#login-btn').css("visibility", "hidden");
            $('#signed-in').css({"visibility": "visible", "display": "inline-block"});
            $('#logout').css("visibility", "visible");
        } else {
            //user is logged out
        }
    });

    //Log in button
   var loginButton = $('#login-btn');
   loginButton.click(function (e) {
        console.log("first");
        e.preventDefault();
        console.log("test");
        loginButton.css("visibility", "hidden");
        auth.login('twitter');
   });

   //Log out button
   var logoutButton = $('#logout');
   logoutButton.click(function (e) {
        e.preventDefault();
        loginButton.css("visibility", "visible");
        logoutButton.css("visibility", "hidden");
        $('#signed-in').css({"display": "none", "visibility": "hidden"});
        auth.logout();
        username = null;
    });





    //When questions are asked, write data to firebase
    $('#questionInput').keypress(function (e) {
        if(e.keyCode == 13) {
            if(username == null) {
                alert("You must sign in with Twitter to ask a question");
            } else {
                var question = $('#questionInput').val();
                var user = username;
                questionRef.push({question:question, user: user, votes: 0});
                usersRef.child(user).child('questions').push({q: question});
                $('#questionInput').val('');
            }

        };
    });

    //Write reply to the reply firebase and parent question firebase
    var replyHandler = function (reply, question, name) {
        repliesRef.push({reply: reply, user: username, question: question.question, votes: 0, questionId: name});
        fbaseRef.child("/questions/" + name + "/replies/").push({reply: reply, user: username, votes: 0});
        usersRef.child(username).child('replies').push({reply: reply, respondingTo: question.question});
    };

    //Render replies when they are added
    repliesRef.on('child_added', function (snapshot) {
        var replyData = snapshot.val();
        var ref = $('#' + replyData.questionId);
        $('<div>', {class: 'outsideDiv'}).append(
            $('<span/>').text(replyData.reply).attr('class', 'replyText').append(
            $('<span/>').text("  - @" + replyData.user).attr('class', 'replyUser'))
        ).appendTo(ref);
    });

    //Callback that displays the new question with a reply field
    var totalQuestions = 1;

    questionRef.limit(10).on('child_added', function (snapshot) {
        var q = snapshot.val();
        //$('<img/>').attr({'class': 'upvote', 'src': 'grayarrow.gif'}).appendTo($('#questionsDiv'));
        $('<div/>').text(q.question).attr({'class': 'question', 'id': "question" + totalQuestions}).appendTo($('#questionsDiv'));
        $('<div/>').attr({'class': 'submittedBy'}).text("By ").append(
            $('<a>').attr({'href': '/profile.html?user=' + q.user, 'class': 'userLink'}).text("@" + q.user)
        ).appendTo($('#questionsDiv'));

        //Display all replies for a given question
        $('<div/>').attr({'id': snapshot.name(), 'class': 'replyInfo'}).appendTo($('#questionsDiv'));

        //Render all replies for a given question
        for (var i in q.replies) {
            var rep = questionRef.child(snapshot.name() + "/replies/" + i);
            rep.on('value', function(snap) {
                var text = snap.val().reply;
                console.log(text);
                $('<div>', {class: 'outsideDiv'}).append(
                    $('<span/>').text(text).attr('class', 'replyText').append(
                    $('<span/>').text(" - @" + snap.val().user).attr('class', 'replyUser'))
                ).appendTo($('#' + snapshot.name()));
            });
        }

        //Add reply input field and line break to DOM
        $('<input/>').attr({'type':'text', 'placeholder':'Add an answer', 'class':'reply', 'id': 'reply' + totalQuestions}).appendTo($('#questionsDiv'));
        $('<hr/>').appendTo('#questionsDiv');


        //Attach enter to replyHandler
        $('#reply' + totalQuestions).keypress(function (e) {
            if (e.keyCode == 13) {
                if(username == null) {
                    alert("You must sign in with Twitter to post an answer");
                } else {
                    var reply = $(e.target).closest('input.reply')[0].value;
                    replyHandler(reply, q, snapshot.name());
                    e.currentTarget.value = '';
                };
            }
        });

        totalQuestions++;
    });

    //Logic for user profile page

        //Create firebase references
    var fbaseRef = new Firebase("fireside.firebaseIO.com/");
    var usersRef = fbaseRef.child('users');

    //Get user's namne
    var user = getURLParameter('user');
    function getURLParameter(name) {
        return decodeURI(
            (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
        );
    }

    //Add user info to header div
    $('<h2/>').text(user).attr('class', 'twitterName').appendTo($('#userInfo'));

    //Get the user's questions from the firebase
    var userQuestionsRef = usersRef.child("/" + user + "/questions/");
    userQuestionsRef.on('value', function (snapshot) {
        var q = snapshot.val();

        //Render questions
        for (var i in q) {
            var question = userQuestionsRef.child(i);
            question.on('value', function (snap) {
                var text = snap.val().q;
                $('<div/>').text(text).attr('class', 'userQ').appendTo($('#userQuestions'));
            })
        }
    });

    //Get the user's replies from the firebase
    var userRepliesRef = usersRef.child("/" + user + "/replies");
    userRepliesRef.on('value', function (snapshot) {
        var r = snapshot.val();

        //Render replies
        for (var i in r) {
            var reply = userRepliesRef.child(i);
            reply.on('value', function (snap) {
                var text = snap.val().reply;
                var question = snap.val().respondingTo;
                $('<div>', {class: 'eachReply'}).append(
                    $('<div/>').text(text).attr('class', 'userR').append(
                    $('<span/>').text(" in response to ").attr('class', 'responseTo').append(
                    $('<div/>').text("\"" + question + "\"").attr('class', 'responseQ')))
                ).appendTo($('#userReplies'));
            })
        }
    });
});