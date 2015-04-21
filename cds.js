
// the current state of the fiter
var filter = { };
var allfacets = {};

// sanitise a string so that it can be used safely in a Lucene search
var sanitise = function(str) {
  var s = str.replace(/'/g,"");
  s = s.replace(/\W/g," ");
  return "'" + s + "'";
}


// perform a search for 'searchText' and optionally apply filters where
// filter is an object like {topic: "NoSQL", language: "HTTP"}
var doSearch = function(searchText,filter, callback) {
  var q = "";
  var sort = null;
  if(searchText.length>0) {
    var niceText = sanitise(searchText);
    q = "(name:"+niceText + " OR body:"+niceText+ " OR full_name:"+niceText + " OR description:"+niceText+")";
  } else {
    q = "*:*";
    sort = '["-date"]'; // newest first
  }
  
  // add filter to the query string - filter is an array of stuff
  for(var i in filter) {
    q += " AND ";
    q += i + ":" + filter[i];
  }
  
  // render the query and filter
  $('#qs').html(q);  
  var limit = 5;      
  var qs = {
      q:q,
      limit:limit,
      counts: '["topic","technology","type","level","language"]',
      include_docs:true
    };       
  if(sort) {
    qs.sort = sort;
    $('#sort').html("Sort = " + sort);
  } else {
    $('#sort').html("");
  }
  var obj = {
    url: "https://reader.cloudant.com/dw/_design/search/_search/search",
    data: qs,
    dataType: "json",
    method: "get"
  };
  
  $.ajax(obj).done(function(data) {
    if (callback) {
      callback(null, data);
    }
  });
  
};

var renderFacetGroup = function(facet, title, datacounts) {
  var html = '<h4>' + title + '</h4>';
  for(var j in allfacets[facet]) {
    var live = false;
    if(datacounts[facet][j]) {
      live = true;
    }
    html += '<div class="row">';
    html += '<div class="col-xs-2"><input type="checkbox" onclick="checktick(this)"';
    html += ' data-facet="'+facet+'" data-value="' + j + '"';
    if(!live) {
      html += " disabled";
    }
    if(filter[facet] && filter[facet] == j) {
      html += " checked";
    }
    html +='></div>';
    html += '<div class="col-xs-10">';
    var theclass = "";
    if(!live) {
      theclass = "muted";
    }
    html += '<span class="' + theclass + '">' + j + '</span>';    
    html += '</div>';    
    html += '</div>';    
  }
  return html;
}

// render the search results 'data' as HTML
var renderSerps = function(data, filter) {
  
  // render docs
  var html = "";
  for(var i in data.rows) {
    var doc = data.rows[i].doc;
    html += '<div class="alert">';
    html += '<h3><a href="' + doc.url + '" target="_new">'+doc.name+'</a></h3>';
    html += '<div class="description">' + doc.description + '</div>';
    html += '</div>';
  }
  
  $('#results').html(html);
  
  // render facets
  var html ="";
  
  html += renderFacetGroup("type","Type",data.counts);
  html += renderFacetGroup("topic","Topics",data.counts);
  html += renderFacetGroup("technology","Technologies",data.counts);
  html += renderFacetGroup("language","Languages",data.counts);
  html += renderFacetGroup("level","Levels",data.counts);

  $('#facets').html(html);
}

// apply a new filter
var applyFilter = function(key, value) {
  filter[key] = value;
  var searchText = $('#searchtext').val();
  doSearch(searchText, filter, function(err, data) {
    renderSerps(data, filter);
  });
}

// when the search form is submitted, clear any existing filters
// and do the search
var submitForm = function() {
  filter = {}; // clear any filters
  var searchText = $('#searchtext').val();
  doSearch(searchText, filter, function(err, data){
    renderSerps(data, filter);
  });
  return false;
}


// onload perform a search for "everything"
var onload = function() {
  searchText = "";
  filter = { };
  var facets = doSearch(searchText, filter, function(err, data) {
    allfacets = data.counts; // record the inital list of facets away for safekeeping
    renderSerps(data,filter);
  });
}

var checktick = function(ctrl) {
  var facet = ctrl.getAttribute('data-facet');
  var value = ctrl.getAttribute('data-value');
  var checked = $(ctrl).is(":checked");
  if(checked) {
    applyFilter(facet, value);
  } else {
    delete filter[facet];
    doSearch(searchText, filter, function(err, data) {
      renderSerps(data, filter);
    });
  }
  
}

$(document).ready(onload);