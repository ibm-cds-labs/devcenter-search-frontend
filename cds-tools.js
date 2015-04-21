
// generate a query string from a a search string and 
// an array of filters
var generateQueryString = function(searchText, filter) {
  var qs = ""
  
  if(searchText && searchText.length>0) {
    qs += "searchText="+encodeURIComponent(searchText);
  }
  if(filter && filter.length>0) {
    qs += "&filter="+encodeURIComponent(JSON.stringify(filter));
  }
  return qs;
}



// when the index page's search form is submitted
var indexSearchSubmit = function() {
  var searchText = $('#bigsearchinput').val();
  var qs = generateQueryString(searchText,[]);
  window.location.href="resources.html#?"+qs;
  return false;
}