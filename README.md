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

- [q=PouchDB](https://d14f43e9-5102-45bc-b394-c92520c2c0bd-bluemix.cloudant.com/dw/_design/search/_search/search?include_docs=true&counts=[%22topic%22,%22technology%22,%22type%22,%22level%22,%22language%22]&q=PouchDB) - a simple free text search
- [q=PouchDB+replication+AND+technology:"Cloudant"](https://d14f43e9-5102-45bc-b394-c92520c2c0bd-bluemix.cloudant.com/dw/_design/search/_search/search?include_docs=true&counts=[%22topic%22,%22technology%22,%22type%22,%22level%22,%22language%22]&q=PouchDB+replication+AND+technology:"Cloudant") - free-text plus fielded search
- [q=\*:\*+AND+topic:"IoT"+AND+topic:"Mobile"+AND+technology:"Cloudant"](https://d14f43e9-5102-45bc-b394-c92520c2c0bd-bluemix.cloudant.com/dw/_design/search/_search/search?include_docs=true&counts=[%22topic%22,%22technology%22,%22type%22,%22level%22,%22language%22]&q=*:*+AND+topic:"IoT"+AND+topic:"Mobile"+AND+technology:"Cloudant") - only fielded search
- [q=\*:\*](https://d14f43e9-5102-45bc-b394-c92520c2c0bd-bluemix.cloudant.com/dw/_design/search/_search/search?include_docs=true&counts=[%22topic%22,%22technology%22,%22type%22,%22level%22,%22language%22]&q=*:*&limit=0) - only the facets

### sort parameter

This **optional** parameter specifies a field on which to order the responses. Choices are:

- [no sort parameter](https://d14f43e9-5102-45bc-b394-c92520c2c0bd-bluemix.cloudant.com/dw/_design/search/_search/search?include_docs=true&counts=[%22topic%22,%22technology%22,%22type%22,%22level%22,%22language%22]&q=cloudant+big+data) - sort by relevance
- [sort=%5B"-date"%5D](https://d14f43e9-5102-45bc-b394-c92520c2c0bd-bluemix.cloudant.com/dw/_design/search/_search/search?include_docs=true&counts=[%22topic%22,%22technology%22,%22type%22,%22level%22,%22language%22]&q=*:*&sort=%5B"-date"%5D) - sort by date (newest first)
- [sort=%5B"-date"%5D](https://d14f43e9-5102-45bc-b394-c92520c2c0bd-bluemix.cloudant.com/dw/_design/search/_search/search?include_docs=true&counts=[%22topic%22,%22technology%22,%22type%22,%22level%22,%22language%22]&q=*:*&sort=%5B"-date"%5D) - sort by date (oldest first)


### limit parameter

This **optional** parameter specifies a limit on the maximum number of documents returned. If omitted, the default is 25.

