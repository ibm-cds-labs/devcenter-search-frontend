# devcenter-search-frontend

## Client
`resources.html` combined with `cds.js` is an example front-end client to the CDS/Bluemix developer advocacy learning materials database, which has a search API implemented on top of the generic Cloudant Search API. 

## Search API
This API documents a subset of Cloudant's implementation of Apache Lucene faceted search. The [full Cloudant API]() is more generic and not tied to any particular data. This API applies to the search index developed for developer advocacy learning materials having the following high-level facets, or categories: 

- **topic:** solution-oriented subject, such as *mobile* or *analytics*
- **technology:** product or service used, such as *Cloudant* or *dashDB*
- **type:** material type, such as *article*, *video* or *code*
- **level:** *beginner*, *intermediate*, or *advanced*
- **language:** programming language

### URL template
A search request may include 0 or more facets, a full-text search term, a limit on the number of documents returned, and a sort field.

https://d14f43e9-5102-45bc-b394-c92520c2c0bd-bluemix.cloudant.com
/dw/\_design/search/\_search/search?include_docs=true&counts=["topic","technology","type","level","language"]
&q=***{search-term}***&limit=***{0..200}***&sort=["***{sort-field}***"]


#### Service API endpoint

This part of the URL never changes:

https://d14f43e9-5102-45bc-b394-c92520c2c0bd-bluemix.cloudant.com
/dw/_design/search/_search/search?include_docs=true&counts=["topic","technology","type","level","language"]

### q parameter

This **mandatory** parameter represents the search query, and includes a a facet match option along with full text search. 

Examples:

- q=\*:\*+AND+topic:"IoT"+AND+topic:"Mobile"+AND+technology:"Cloudant"
- ...
- ...

### sort parameter

This **optional** parameter specifies a field on which to order the responses. Choices are ...

### limit parameter

This **optional** parameter specifies a limit on the maximum number of documents returned. If omitted, the default is ???.

