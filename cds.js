

var filter = { };


var sanitise = function(str) {
  var s = str.replace(/'/g,"");
  s = s.replace(/\W/g," ");
  return "'" + s + "'";
}
var doSearch = function() {
  
  var searchText = $('#searchtext').val();
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
    
    // render docs
    var html = "";
    for(var i in data.rows) {
      var doc = data.rows[i].doc;
      html += '<div class="alert">';
      html += '<h3><a href="' + doc.url + '" target="_new">'+doc.name+'</a></h3>';
      html += '<div class="description">' + doc.description + '</div>';
      html += '<span class="label label-default sep">' + doc.type + '</span>'
      for(var j in doc.topic) {
        html += '<span class="label label-primary sep">' + doc.topic[j] + '</span>'
      }
      for(var j in doc.technologies) {
        html += '<span class="label label-success sep">' + doc.technologies[j] + '</span>'
      }
      if(doc.languages && doc.languages.length>0) {
        for(var j in doc.languages) {
          html += '<span class="label label-info sep">' + doc.languages[j] + '</span>'
        }
      }
      if(doc.level) {
        html += '<span class="label label-warning sep">' + doc.level + '</span>'
      }
     
      html += '</div>';
    }
    
    $('#results').html(html);
    
    // render facets
    var html ="";
    html += '<h3>Type</h3>';
    for(var j in data.counts.type) {
      html += '<a href="Javascript:applyFilter(\'type\',\'' + j + '\')">';
      html += '<span class="label label-default sep">' + j + '(' + data.counts.type[j] +  ')</span>'    
      html += '</a><br>'    
    }
    html += '<h3>Topics</h3>';
    for(var j in data.counts.topic) {
      html += '<a href="Javascript:applyFilter(\'topic\',\'' + j + '\')">';
      html += '<span class="label label-primary sep">' + j + '(' + data.counts.topic[j] +  ')</span>';
      html += '</a><br>'    
    }
    html += '<h3>Technologies</h3>';
    for(var j in data.counts.technology) {
      html += '<a href="Javascript:applyFilter(\'technology\',\'' + j + '\')">';
      html += '<span class="label label-success sep">' + j + '(' + data.counts.technology[j] +  ')</span>'    
      html += '</a><br>'    
    }
    html += '<h3>Language</h3>';
    for(var j in data.counts.language) {
      html += '<a href="Javascript:applyFilter(\'language\',\'' + j + '\')">';
      html += '<span class="label label-info sep">' + j + '(' + data.counts.language[j] +  ')</span>'    
      html += '</a><br>'    
    }
    html += '<h3>Level</h3>';
    for(var j in data.counts.level) {
      html += '<a href="Javascript:applyFilter(\'level\',\'' + j + '\')">';
      html += '<span class="label label-warning sep">' + j + '(' + data.counts.level[j] +  ')</span>'    
      html += '</a><br>'    
    }
    $('#facets').html(html);

  });
  
};

var applyFilter = function(key, value) {
  filter[key] = value;
  doSearch();
}

var submitForm = function() {
  filter = {};
  doSearch();
  return false;
}

var onload = function() {
  doSearch();
}

$(document).ready(onload);