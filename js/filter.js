function FilterItems(e) {
console.log(e.id);
}


function CreateFeed(){

  var template = _.template("<hr><header class='post-header'><h2 class='post-title'><%= titel %></h2>  <p class='post-meta'><%= meta %></p></header><div class='post-description'><p><%= description %></p></div></section>");
  //console.log(template);
  var render = template({titel: 'Ich bin ein Titel'});
  var para = document.createElement("section");
  para.className="post";
  para.innerHTML= render;
  document.getElementById("postsection").appendChild(para);

}
