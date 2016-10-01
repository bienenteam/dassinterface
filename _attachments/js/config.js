
var RSScfg = {

    url : 'http://93.180.156.188:5984/',        // url mit abshcliessendem "/"
    db : 'beehive/',                            // mit abschliessendem "/"
    feeds : {},
    currEdit : false,

    loadFeeds : function(){


      this.request('GET',this.url + this.db + '_design/all/_view/by_type?key="feed"&include_docs=true', function(d){    RSScfg.renderFeeds(d); }, ""  );


    },

    renderFeeds: function( _data ){

        var data = _data.data;

        var obj = document.getElementById("feedList");
        obj.innerHTML = '';

        if( data.rows.length > 0 ){

          for( var i = 0; i < data.rows.length; i++){
            if( data.rows[i].doc.disabled ){
                continue;
            }
            this.feeds[ data.rows[i].value ] = data.rows[i] ;

            var el = document.createElement("div");
            el.innerHTML = '<div class="feedlist"> <b>'+ data.rows[i].doc.name +'</b> <a href="#editFeed" onclick="RSScfg.editFeed(\''+ data.rows[i].value +'\');">[edit]</a><a href="#editFeed" onclick="RSScfg.delete(\''+ data.rows[i].value +'\' );">[x]</a>  </div>';
            obj.appendChild(el);
          }

        }else{

          var el = document.createElement("div");
          el.innerHTML = '<div> Keine Feeds vorhanden </div>';
          obj.appendChild(el);

        }

        var el = document.createElement("div");
        el.innerHTML = '<div> <b><a href="#editFeed" style="color:#000" onclick="RSScfg.editFeed( 0 );">[ Feed hinzuf&uuml;gen ]</a>  </div>';
        obj.appendChild(el);

    },

    editFeed: function(id){

      this.currEdit = id;

      document.getElementById("feedList").style.display ="none";

      var el = document.getElementById("feedEdit");
       el.style.display = "block";

       var feed = { name : '', url: ''};
       if( id != 0 ){
         feed = this.feeds[ id ].doc;
       }

        document.getElementById("feedname").value = feed.name;
        document.getElementById("feedurl").value = feed.url;

    },


  save : function(){

    var data = ( this.currEdit == 0 )? { type: "feed" } : this.feeds[ this.currEdit ].doc;
    data["name"] = document.getElementById("feedname").value;
    data["url"] = document.getElementById("feedurl").value;

    if( data["url"].length < 11 ){
      alert("Error: Eine gültige Url wäre gut.");
      return;
    }

    if( data["name"] == '' ){
      alert("Error: Ein Name wäre gut.");
      return;
    }

    if( this.currEdit != 0 ){

      // change
      data["_id"] =  this.feeds[ this.currEdit ]._id;
      data["rev"] =  this.feeds[ this.currEdit ].rev;
      this._save( data );

    }else{
      // neu
      this.request('GET', this.url + "_uuids" , function(d){
            RSScfg.currEdit = d.data.uuids;
            RSScfg._save( data );

         }, '');

    }

  },

  _save : function( data ){

        this.request('PUT', this.url + this.db +  this.currEdit , function(d){

                RSScfg.hideEdit();
                RSScfg.currEdit = false;
                RSScfg.loadFeeds();

              }, data  );

  },

  delete: function( id ){

    if( !confirm( this.feeds[ id ].doc.name + " Wirklich entfernen?") ){
        return;
    }

    this.currEdit = id;
    var data = RSScfg.feeds[ id ].doc;
    data["disabled"] = true;

    this._save( data );

    /* if( confirm( this.feeds[ id ].doc.name + " Wirklich entfernen?") ){
      this.request( 'DELETE', this.url + this.db + id +"?rev="+ RSScfg.feeds[ id ].doc._rev , function(){   RSScfg.loadFeeds();  }, '' );
    }
    */
  },

  hideEdit: function(){

      document.getElementById("feedEdit").style.display ="none";
      document.getElementById("feedList").style.display ="block";

  },

  	request : function(method, url, callback, body) {

      var rx = new XMLHttpRequest();
  		rx.open(method, url);
      if( method == 'PUT'){
        rx.setRequestHeader('Content-Type', 'application/json')
      }
      rx.addEventListener('load', function() {
        	callback({
    				data: JSON.parse(rx.responseText)
    			});
  		});

  		if (body)
  			rx.send(JSON.stringify(body));
  		else
  			rx.send();
  	}

};
