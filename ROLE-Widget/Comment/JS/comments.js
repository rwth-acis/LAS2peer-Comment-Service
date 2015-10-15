/**
 * Comment Widget to display a comment thread (and to interact with it).
 */
var api = i5.las2peer.jsAPI;

/*
  Check explicitly if gadgets is known, i.e. script is executed in widget environment.
  Allows compatibility as a Web page.
 */

if (typeof gadgets !== "undefined" && gadgets !== null) {
  iwcCallback = function (intent) {
    //listen to intent, wait for action
    if (intent.action === "SHOW_COMMENTS") {
      //react on intent data
      showComments(intent.data);
    }

    };
  iwcManager = new api.IWCManager(iwcCallback);
}
else {
	$(document).ready(function () {
		if(!window.location.hash) return;
		showComments(window.location.hash.substr(1));
	});

	$(window).on('hashchange', function() {
		if(!window.location.hash) return;
		showComments(window.location.hash.substr(1));
	});
}

// login
var login = new api.Login(api.LoginTypes.HTTP_BASIC);
login.setUserAndPassword("alice", "pwalice"); // TODO login daten
/*
 * TODO up/downvote
 * TODO fehlerbehandlung
 * TODO exampleservice frontend
 * TODO ROLE widget
 */

var requestSender = new api.RequestSender("http://localhost:8080/comments", login);


$(document).ready(function () {
  init();
});

var init = function () {
};

var context = {
  admin: false,
  writer: false
};

var showComments = function (threadId) {
	var request = new api.Request("get", "threads/"+threadId, "", function (data) {
    data = JSON.parse(data);

    context.admin = data.isAdmin;
    context.writer = data.isWriter;

		var html = '<div id="thread-'+threadId+'">';
		html += renderCommentThread(data);
		html += '</div>';

		document.getElementById('main').innerHTML = html;
	});
	requestSender.sendRequestObj(request);
}

var addComment = function (threadId,body) {
	var request = new api.Request("post", "threads/"+threadId, body, function (data) {
		getComment(data,threadId);
	});
	requestSender.sendRequestObj(request);
}

var getComment = function(commentId, threadId) {
	var request = new api.Request("get", "comment/"+commentId, "", function (data) {
		data = JSON.parse(data);

		var html ='<div id="comment-'+data.id+'">';
		html+=renderComment(data);
		html+='</div>';

		document.getElementById('thread-'+threadId).getElementsByClassName("comments")[0].innerHTML += html;
	});
	requestSender.sendRequestObj(request);
}

var editComment = function (commentId,newBody) {
	var request = new api.Request("put", "comment/"+commentId, newBody, function (data) {
		var html = renderComment(JSON.parse(data));

		document.getElementById('comment-'+commentId).innerHTML = html;
	});
	requestSender.sendRequestObj(request);
}

var deleteComment = function (commentId) {
	var request = new api.Request("delete", "comment/"+commentId, "", function (data) {
		document.getElementById('comment-'+commentId).parentElement.removeChild(document.getElementById('comment-'+commentId));
	});
	requestSender.sendRequestObj(request);
}

var submitVote = function (commentId,upvote) {
	var request = new api.Request("post", "comment/"+commentId+"/votes", upvote+"", function (data) {
    document.getElementById("votes-"+commendId).innerHTML=renderRating(commentId,upvote ? 1 : -1,0); // TODO

		console.log(data);
	});
	requestSender.sendRequestObj(request);
}

var renderCommentThread = function (data) {
	var html='<div class="comments">';

	for (var i=0;i<data.comments.length;i++) {
		html+='<div id="comment-'+data.comments[i].id+'">';
		html+=renderComment(data.comments[i]);
		html+='</div>';
	}

	html+="</div>";

  if (context.writer)
	 html+='<div class="add"><form onsubmit="submitAddForm(this);return false;"><textarea name="body"></textarea><br /><input type="hidden" name="threadId" value="'+data.id+'" /><input type="submit" value="Add" /></form></div>';

	return html;
}

var renderComment = function (data) {
	var html = '<div class="content"><p><small>'+data.author.name+', '+data.date+'</small></p>'
		     + '<p>'+escapeHtml(data.body)+'</p></div>';


	html += '<div class="votes" id="votes-\''+data.id+'\'">';
  html+=renderRating(data.id,data.myRating,data.rating);
	html += '</div>';

	if (data.author.isMe || context.admin) {
		html+='<div class="actions">';

    if (data.author.isMe) {
      html+='<button onclick="toggleVisibility(\'edit-'+data.id+'\')">EDIT</button>';
    }

    html+='<button onclick="deleteComment(\''+data.id+'\')">DELETE</button>';
    html+='</div>';

		html+='<div class="edit" id="edit-'+data.id+'" hidden><form onsubmit="submitEditForm(this);return false;"><textarea name="body">'+escapeHtml(data.body)+'</textarea><br /><input type="hidden" name="id" value="'+data.id+'" /><input type="submit" value="Edit" /></form></div>';
	}

	html+='<div></div>';

	return html;
}

var renderRating = function(commentId,myRating,rating) {
  var html='<span class="rating">'+rating+'</span>';

  if (context.writer) {
    html += '<button '+ (myRating==1 ? 'disabled' : '' ) +' onclick="submitVote(\''+commentId+'\',true)">UPVOTE</button>';
    html += '<button '+ (myRating==-1 ? 'disabled' : '' ) +' onclick="submitVote(\''+commentId+'\',false)">DOWNVOTE</button>';
  }

  return html;
}

var submitAddForm = function(target) {
	addComment(target.elements[1].value,target.elements[0].value);
	target.reset();
}

var submitEditForm = function(target) {
	editComment(target.elements[1].value,target.elements[0].value);
}

var toggleVisibility = function(id) {
  document.getElementById(id).hidden = !document.getElementById(id).hidden;
}



// helper functions

// from mustache.js
var entityMap = {
	    "&": "&amp;",
	    "<": "&lt;",
	    ">": "&gt;",
	    '"': '&quot;',
	    "'": '&#39;',
	    "/": '&#x2F;'
	  };

	  function escapeHtml(string) {
	    return String(string).replace(/[&<>"'\/]/g, function (s) {
	      return entityMap[s];
	    });
	  }
