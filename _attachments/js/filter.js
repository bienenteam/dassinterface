window.onscroll = function() {
  if($(window).scrollTop() + $(window).height() == $(document).height()) {
         TriggerData();
     }
  if($(window).scrollTop()>=80) {
        db.setPollActive(false);
    }
  else{
        db.setPollActive(true);
  }
};




function TriggerData(){
  console.log($(window).height());
  if($(window).height()<=$('#postsection').height()){
    db.pollPrevious();
  }

}

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
  /*if(postsection.innerHTML=="")
  {
    var template = _.template("<hr><header class='post-header'><h2 class='post-title'>Keine Feeds zu sehen</h2>  <p class='post-meta'></p></header><div class='post-description'><p></p></div></section>");
    var render = template();
    var para = document.createElement("section");
    para.className+="post";
    para.className+="empty";
    var section = document.getElementById("postsection");
    section.insertBefore( para, section.firstChild );
  }*/

}


function CreateFeedItem(item){
  var smaller="";
  if(item.title.length >60)
    smaller ="small-header";
  if(item.title.length >120)
    smaller ="smaller-header";

  var template = _.template("<hr><header class='post-header'><h2 class='post-title "+smaller+"''><%= title %></h2>  <p class='post-meta'><a href='<%= link %>'><%= link %></a></p></header><div class='post-description'><p><%= summary %></p></div></section>");
  console.log(item);
  var render = template(item);
  var para = document.createElement("section");
  para.className+="post";
  para.className+="lazyload";
  para.innerHTML= render;
  return para;
}

function CreateFeedItemTop(item){
  var section = document.getElementById("postsection");
  section.insertBefore( CreateFeedItem(item), section.firstChild );
}

function CreateFeedItemBottom(item){
  var section = document.getElementById("postsection");
  section.appendChild(CreateFeedItem(item));
}

function CreateFeed(feed){
  var feedname = feed.name;
  var template = _.template("<a style='vertical-align:middle;' class='pure-button masterTooltip' onclick='FilterItems(this)' id='<%= _id %>' title='"+feedname+"'><%= name %></a>");
  console.log(feed);
  feed.name = feed.name.substring(0,1);
  var render = template(feed);
  var para = document.createElement("li");
  para.className="nav-item active-source";
  para.innerHTML= render;

  var section = document.getElementById("feed-list");
  var childDivs = $( "#feed-list" ).children();
  var before =null;
  if(childDivs != null){
    for( i=0; i< childDivs.length; i++ )
    {
      var childDiv = childDivs[i];
      if((childDiv.getElementsByTagName('a')[0].getAttribute('title') > feedname)){
        before = childDiv;
      }
    }
  }
  if(before != null){
    section.insertBefore( para, before );
  }
  else{
    section.appendChild(para);
  }
  UpdateTooltip();
}

function UpdateTooltip()
{
  $('.masterTooltip').hover(function(){
          // Hover over code
          console.log(this);
          var title = $(this).attr('title');
          $(this).data('tipText', title).removeAttr('title');
          $('<div class="tooltip"></div>')
          .text(title)
          .prependTo('body')
          .fadeIn('slow');
  }, function() {
          $(this).attr('title', $(this).data('tipText'));
          $('.tooltip').remove();
  }).mousemove(function(e) {
          var mousex = e.pageX + 20;
          var mousey = e.pageY + 10;

          if(e.pageX >($( document ).width()/2))
            mousex = e.pageX - 20- $('.tooltip').width();
          $('.tooltip')
          .css({ top: mousey, left: mousex })
  });
}
