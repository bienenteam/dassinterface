function FilterItems(e) {
  var postsection = document.getElementById("postsection");
  postsection.innerHTML="";


  if(e.parentNode.classList.contains("active-source")){
    e.parentNode.classList.remove("active-source");
    db.setHideFeed(e.id);
  }
  else{
    e.parentNode.classList.add("active-source");
    db.setShowFeed(e.id);
  }
}


function CreateFeedItem(item){

  var template = _.template("<hr><header class='post-header'><h2 class='post-title'><%= title %></h2>  <p class='post-meta'><%= link %></p></header><div class='post-description'><p><%= summary %></p></div></section>");
  console.log(item);
  var render = template(item);
  var para = document.createElement("section");
  para.className="post";
  para.innerHTML= render;
  var section = document.getElementById("postsection");
  section.insertBefore( para, section.firstChild );
}


function CreateFeed(feed){

  var template = _.template("<a class='pure-button' onclick='FilterItems(this)' id='<%= id %>'><%= title %></a>");
  console.log(feed);
  var render = template(feed);
  var para = document.createElement("li");
  para.className="nav-item active-source";
  para.innerHTML= render;
  var section = document.getElementById("nav-list");
  section.insertBefore( para, section.firstChild );
}
