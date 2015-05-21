
// the current state of the fiter
var filter = [];
var allfacets = {};
var searchResults = {};
var renderedSerps = {};
var CLOUDANT_URL = "https://d14f43e9-5102-45bc-b394-c92520c2c0bd-bluemix.cloudant.com";

// sanitise a string so that it can be used safely in a Lucene search
var sanitise = function(str) {
  var s = str.replace(/'/g,"");
  s = s.replace(/\W/g," ");
  return '"' + s + '"';
}

// from https://github.com/balupton/jquery-sparkle/blob/master/scripts/resources/core.string.js
String.prototype.queryStringToJSON = String.prototype.queryStringToJSON || function ( )
{	// Turns a params string or url into an array of params
	// Prepare
	var params = String(this);
	// Remove url if need be
	params = params.substring(params.indexOf('?')+1);
	// params = params.substring(params.indexOf('#')+1);
	// Change + to %20, the %20 is fixed up later with the decode
	params = params.replace(/\+/g, '%20');
	// Do we have JSON string
	if ( params.substring(0,1) === '{' && params.substring(params.length-1) === '}' )
	{	// We have a JSON string
		return eval(decodeURIComponent(params));
	}
	// We have a params string
	params = params.split(/\&(amp\;)?/);
	var json = {};
	// We have params
	for ( var i = 0, n = params.length; i < n; ++i )
	{
		// Adjust
		var param = params[i] || null;
		if ( param === null ) { continue; }
		param = param.split('=');
		if ( param === null ) { continue; }
		// ^ We now have "var=blah" into ["var","blah"]

		// Get
		var key = param[0] || null;
		if ( key === null ) { continue; }
		if ( typeof param[1] === 'undefined' ) { continue; }
		var value = param[1];
		// ^ We now have the parts

		// Fix
		key = decodeURIComponent(key);
		value = decodeURIComponent(value);
		try {
		    // value can be converted
		    value = eval(value);
		} catch ( e ) {
		    // value is a normal string
		}

		// Set
		// window.console.log({'key':key,'value':value}, split);
		var keys = key.split('.');
		if ( keys.length === 1 )
		{	// Simple
			json[key] = value;
		}
		else
		{	// Advanced (Recreating an object)
			var path = '',
				cmd = '';
			// Ensure Path Exists
			$.each(keys,function(ii,key){
				path += '["'+key.replace(/"/g,'\\"')+'"]';
				jsonCLOSUREGLOBAL = json; // we have made this a global as closure compiler struggles with evals
				cmd = 'if ( typeof jsonCLOSUREGLOBAL'+path+' === "undefined" ) jsonCLOSUREGLOBAL'+path+' = {}';
				eval(cmd);
				json = jsonCLOSUREGLOBAL;
				delete jsonCLOSUREGLOBAL;
			});
			// Apply Value
			jsonCLOSUREGLOBAL = json; // we have made this a global as closure compiler struggles with evals
			valueCLOSUREGLOBAL = value; // we have made this a global as closure compiler struggles with evals
			cmd = 'jsonCLOSUREGLOBAL'+path+' = valueCLOSUREGLOBAL';
			eval(cmd);
			json = jsonCLOSUREGLOBAL;
			delete jsonCLOSUREGLOBAL;
			delete valueCLOSUREGLOBAL;
		}
		// ^ We now have the parts added to your JSON object
	}
	return json;
};

var disableAllCheckBoxes = function() {
  // then disable everything, it's going to get redrawn anyway
  $('input[type=checkbox]').prop("disabled", true);
}


// perform a search for 'searchText' and optionally apply filters where
// filter is an object like {topic: "NoSQL", language: "HTTP"}
var doSearch = function(searchText,filter, dontChangeURL, callback) {
  disableAllCheckBoxes();
  $('#loading').show();
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
    q += filter[i].key + ":" + sanitise(filter[i].value);
  }
  
  // render the query and filter
  $('#qs').html(q);  
  var limit = 20;      
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
    url: CLOUDANT_URL + "/dw/_design/search/_search/search",
    data: qs,
    dataType: "json",
    method: "get"
  };
  
  $.ajax(obj).done(function(data) {
    var qs = generateQueryString(searchText,filter);
    if(!dontChangeURL) {
      window.location.href= window.location.pathname+"#?"+qs;      
    }
    $('#loading').hide();
    if (callback) {
      callback(null, data);
    }
  });
  
};

// render a list of facets from the object 'datacounts' using the item 'facet'.
var renderFacetGroup = function(facet, title, datacounts) {
  var html = '<h4>' + title + '</h4>';
  var i=0;
  for(var j in allfacets[facet]) {
    var live = false;
    if(datacounts[facet][j]) {
      live = true;
    }
    html += '<div class="row facet-row">';
    html += '<div class="col-xs-2"><input id="facet' + facet+i + '" type="checkbox" onclick="checktick(this)"';
    html += ' data-facet="'+facet+'" data-value="' + j + '"';
    if(!live) {
      html += " disabled";
    }
    if(isFilterSelected(facet, j)) {
      html += " checked";
    }
    html +='></div>';
    html += '<div class="col-xs-10">';
    var c = "";
    if(!live) {
      c = "muted";
    }
    html += '<label for="facet'+facet+i+'" class="'+ c+ '">' + j + '</label>';    
    html += '</div>';    
    html += '</div>';    
    i++;
  }
  return html;
}

// render the search results 'data' as HTML
var renderSerps = function(data, filter) {
  
  renderedSerps = data;
    
  // render docs
  var html = "";
  for(var i in data.rows) {
    var doc = data.rows[i].doc;
    var truncatedDesc = truncateDescription(doc.description);
    var truncatedURL = truncateURL(doc.url);
    html += '<div class="row">';
    html += '<div class="col-xs-12 results-document">';    
    html += '<h3><a href="' + doc.url + '" target="_new" class="result_link" data-result-index="' + i + '" data-result-id="' + doc._id + '">'+doc.name+'</a></h3>';
    html += '<h4><a href="' + doc.url + '">' + truncatedURL + '</a></h4>';
    html += '<div class="description show-less'+ i +'">' + truncatedDesc;
    html += '<a class="editlink" rel="nofollow" target="_new" href="https://devcenter.mybluemix.net/doc/'+ doc._id +'"><span class="editicon glyphicon glyphicon-share-alt"></span></a>';
    html += '</div>';
    
    
    
    html += '<div class="row expanded-result-row show-more'+ i +' show-more-default">';
    html += '<div class="col-xs-2 show-more'+ i +' show-more-default" id="result-image-placeholder">';
    if (doc.imageurl) {
      html += '<img src="' + doc.imageurl + '" class="img-responsive"/>';
    } else {
      html += '&nbsp;';
    }
    html += '</div>';
     
    
    
    html += '<div class="col-xs-10 show-more'+ i +' show-more-default">';
    html += '<div class="description show-more'+ i +' show-more-default">' + doc.description;
    html += '<a class="editlink" rel="nofollow" target="_new" href="https://devcenter.mybluemix.net/doc/'+ doc._id +'"><span class="editicon glyphicon glyphicon-share-alt"></span></a>';
    html += '</div>';
    
    html += '<div class="facets show-more'+ i +' show-more-default">';
     for(var j in doc.topic) {
      html += '<span>' + doc.topic[j] + '</span>'
    }
    for(var j in doc.technologies) {
      html += '<span>' + doc.technologies[j] + '</span>'
    }
    if(doc.languages && doc.languages.length>0) {
      for(var j in doc.languages) {
        html += '<span>' + doc.languages[j] + '</span>'
      }
    }
    if(doc.level) {
      html += '<span>' + doc.level + '</span>'
    }
    html += '</div>';
    
    
    html += '</div>';
    html += '</div>';
    
    
    html += '<div class="result-expand-collapse display-less" data-result-index="' + i + '" data-result-id="' + doc._id + '">';
    
    html += '<div class="more-text show-less'+ i +'">More <span class="glyphicon glyphicon-menu-down" aria-hidden="true"></span></div>';
    
    html += '<div class="less-text show-more'+ i +' show-more-default">Less <span class="glyphicon glyphicon-menu-up" aria-hidden="true"></div>';
    
    html += '</div>';
    
    
    html += '</div>';
    html += '</div>';
  }
  
  $('#results').html(html);
  
  // render facets
  var html ="";
  html += '<div class="clearall">';
  if(filter.length > 0) {
    html += '<a href="Javascript:clearAllFilters()">Clear</a>';
  }
  html += '</div>';
//  html += renderFacetGroup("type","Type",data.counts);
  html += renderFacetGroup("topic","Topics",data.counts);
  html += renderFacetGroup("technology","Technologies",data.counts);
  html += renderFacetGroup("language","Languages",data.counts);
  html += renderFacetGroup("level","Levels",data.counts);

  $('#facets').html(html);
}

// truncate description text if longer than 200 chars
var truncateDescription = function(string) {
  if (string.length > 200) {
    return string.substring(0,200) + '...';
  } else {
    return string
  }
}

// truncate URL for search display
var truncateURL = function(string) {
  if (string.length > 50) {
    return string.substring(0,50) + '...';
  } else {
    return string
  }
}

// apply a new filter
var applyFilter = function(key, value) {
  var newfilter = { key: key, value:value};
  filter.push(newfilter);
  var searchText = $('#searchtext').val();
  doSearch(searchText, filter, false, function(err, data) {
    renderSerps(data, filter);
  });
}

// remove a filter
var removeFilter = function(key, value) {
  for(var i in filter) {
    if(filter[i].key == key && filter[i].value==value) {
      filter.splice(i,1);
      break;
    }
  }
  var searchText = $('#searchtext').val();
  doSearch(searchText, filter, false, function(err, data) {
    renderSerps(data, filter);
  });
}

// check whether a filter is currently selected or not
var isFilterSelected = function(key, value) {
  for(var i in filter) {
    if(filter[i].key == key && filter[i].value==value) {
      return true;
    }
  }
  return false;
}

// when the search form is submitted, clear any existing filters
// and do the search
var submitForm = function() {
  filter = []; // clear any filters
  var searchText = $('#searchtext').val();
  doSearch(searchText, filter, false, function(err, data){
    renderSerps(data, filter);
  });
  return false;
}

var clearAllFilters = function() {
  submitForm();
}

// onload perform a search for "everything"
var onload = function() {
  searchText = "";
  filter = [];
  
  // do first search to get all the facets
  doSearch(searchText, filter, true, function(err, data) {
    // record the inital list of facets away for safekeeping
    allfacets = data.counts;
    searchResults = data;
    renderSerps(data,filter);

    // parse the query string
    var hash = location.hash;
    if(hash) {
      
      // strip bits
      hash = hash.replace(/^#/,"");
      hash = hash.replace(/^\?/,"");
      hash = hash.queryStringToJSON();
      
      // extract search and filter
      searchText = (typeof hash.searchText=="string")?hash.searchText:"";
      filter = (typeof hash.filter == "object")?hash.filter:[];
      selectedId = (typeof hash.id == "string")?hash.id:null;
      // console.log(searchText,filter,selectedId);
      
      // feed the search box
      $('#searchtext').val(searchText);
      
      // do a second search
      doSearch(searchText, filter, false, function(err, data) {
        searchResults = data;
        renderSerps(data, filter);
      });
    } 
  });
 
  // Suppress anchor firing and show modal when clicked
  $(document).on("click", ".result_link", function(e) {
    e.preventDefault();
  });
  
  // Expand/collapse when more/less is clicked for result
  
  $(document).on("click", ".result-expand-collapse", function(e) {
    var resultIndex = $(this).attr('data-result-index');
    
    if ($(this).hasClass('display-less')) {
      expandResult(resultIndex);
      $(this).removeClass('display-less');
    } else {
      collapseResult(resultIndex);
      $(this).addClass('display-less');
    }
  });
  
  var expandResult = function(index) {
    console.log('expand');
    console.log(index);
    
    
    $('.show-more'+ index).show();
    $('.show-less'+ index).hide();
    
  };
  
  var collapseResult = function(index) {
    console.log('collapse');
    console.log(index);
    
    
    $('.show-less'+ index).show();
    $('.show-more'+ index).hide();
    
    
  }
  
}

// when a checkbox is ticked
var checktick = function(ctrl) {

  var facet = ctrl.getAttribute('data-facet');
  var value = ctrl.getAttribute('data-value');
  var checked = $(ctrl).is(":checked");
  if(checked) {
    applyFilter(facet, value);
  } else {
    removeFilter(facet, value);
  }
  
}

// when the index page's search form is submitted
var indexSearchSubmit = function() {
  return false;
  var searchText = $('#bigsearchinput').val();
  var qs = generateQueryString(searchText,[]);
  window.location.href="resources.html#?"+qs;
  return false;
}


// on load
$(document).ready(onload);
