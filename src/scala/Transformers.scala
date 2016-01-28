package com.gigya.styxserver

import net.minidev.json.{JSONObject, JSONValue, JSONArray}
import scala.collection.JavaConversions._


/**
  * Created by ehud on 1/20/16.
  */
class FacteTranform {

  def buildTerms(field: String): JSONObject = {
    val termsP = new JSONObject()
    val terms = new JSONObject()
    val fieldJSN = new JSONObject()
    terms.put("terms", fieldJSN)
    fieldJSN.put("field", field)
    terms
    termsP.put("terms",terms)
    termsP
  }

  def isFacetsTerms(str : String) : Boolean= {
    val asJSON = JSONValue.parseWithException(str).asInstanceOf[JSONObject]
    val facets = getAsJSON(asJSON,"facets")
    val terms = getAsJSON(facets,"terms")
    terms != null
  }

  def transform(str : String) : String = {
    val asJSON = JSONValue.parseWithException(str).asInstanceOf[JSONObject]
    val size = asJSON.get("size").asInstanceOf[Int]
    val facets = getAsJSON(asJSON,"facets")
    val terms = getAsJSON(facets,"terms")
    val field = getAsJSON(terms,"terms").get("field").asInstanceOf[String]
    val facetFilter = getAsJSON(terms,"facet_filter")
    val fQuery= getAsJSON(facetFilter,"fquery")
    val query = getAsJSON(fQuery,"query")
    val filterd = getAsJSON(query,"filtered")
    val filter = getAsJSON(filterd,"filter")



    build(fQuery, buildTerms(field), size).toString()
  }


  def build(fquery : JSONObject, terms: JSONObject, size: Integer): JSONObject = {
    val fqueryFilter = new JSONObject()
    fqueryFilter.put("filter",fquery)
    fqueryFilter.put("filter",fquery)
    fqueryFilter.put("aggs",terms)

    val aggs = new JSONObject()
    val aggsBody = new JSONObject()
    aggs.put("aggs",aggsBody)
    aggsBody.put("fquery", fqueryFilter)
    aggs.put("size",size)
    aggs
  }

  def getAsJSON(jSONObject: JSONObject, key : String) : JSONObject = {
    jSONObject.get(key).asInstanceOf[JSONObject]
  }

  def getAsArray(jSONObject: JSONObject, key : String) : JSONArray = {
    jSONObject.get(key).asInstanceOf[JSONArray]
  }




  def toResult(str : String) : JSONObject = {
    val asJSON = JSONValue.parseWithException(str).asInstanceOf[JSONObject]


    val aggregations = getAsJSON(asJSON,"aggregations")
    val fquery = getAsJSON(aggregations, "fquery")
    val aggTerms = getAsJSON(fquery, "terms")
    val buckets = getAsArray(aggTerms, "buckets")



    var missing : Integer =  -1
    val total : java.lang.Integer =  fquery.get("doc_count").asInstanceOf[java.lang.Integer ]
    val other : java.lang.Integer =  aggTerms.get("sum_other_doc_count").asInstanceOf[java.lang.Integer ]




    val facets = new JSONObject()
    asJSON.put("facets", facets)
    val outTerms = new JSONObject()

    facets.put("terms",outTerms)
    outTerms.put("_type","terms")
    outTerms.put("missing", missing)
    outTerms.put("total", total)
    outTerms.put("other", other)
    val innerTerms = new JSONArray()
    outTerms.put("terms", innerTerms)
    buckets.foreach(par => {
      val specificBucket = par.asInstanceOf[JSONObject]
      val j = new JSONObject
      j.put("term", specificBucket.get("key"))
      j.put("count", specificBucket.get("doc_count"))
      innerTerms.add(j)
    })


    asJSON
  }

}

class HistogramFacetTransformer{


  def is(str : String) : Boolean= {
    val asJSON = JSONValue.parseWithException(str).asInstanceOf[JSONObject]
    val facets = getAsJSON(asJSON,"facets")
    val zero = getAsJSON(facets,"0")
    zero != null
  }

  def build(filter: JSONObject, dataHistogram: JSONObject, size: Integer) = {
    val result = new JSONObject()
    val fQuery = new JSONObject()
    val innerAggs = new JSONObject()
    val histogramZero = new JSONObject()
    val outer = new JSONObject()
    val outerFquery = new JSONObject()
    result.put("aggs",outerFquery)
    outerFquery.put("fquery", fQuery)
    fQuery.put("filter",filter)
    fQuery.put("aggs", outer)
    outer.put("0",histogramZero)
    histogramZero.put("date_histogram", dataHistogram)
    result.put("size",size)
    result

  }

  def transform(str : String) : String = {
    val asJSON = JSONValue.parseWithException(str).asInstanceOf[JSONObject]
    val size = asJSON.get("size").asInstanceOf[Int]
    val facets = getAsJSON(asJSON,"facets")
    val zero = getAsJSON(facets,"0")
    val dataHistogram  = getAsJSON( zero, "date_histogram")
    val facetFilter = getAsJSON(zero,"facet_filter")
    val fQuery= getAsJSON(facetFilter,"fquery")
    build(fQuery, dataHistogram, size).toString()
  }


  def getAsJSON(jSONObject: JSONObject, key : String) : JSONObject = {
    jSONObject.get(key).asInstanceOf[JSONObject]
  }

  def getAsArray(jSONObject: JSONObject, key : String) : JSONArray = {
    jSONObject.get(key).asInstanceOf[JSONArray]
  }

  def toResult(outout: String): JSONObject = {
    val aggregationFullResult = JSONValue.parseWithException(outout).asInstanceOf[JSONObject]
    val aggregations = getAsJSON(aggregationFullResult, "aggregations")
    val fquery = getAsJSON(aggregations, "fquery")
    val zero = getAsJSON(fquery, "0")
    val buckets = getAsArray(zero, "buckets")

    val newFacets = new JSONObject()
    val newZero = new JSONObject()
    val entries = new JSONArray
    newFacets.put("0", newZero)
    newZero.put("_type","date_histogram")
    newZero.put("entries",entries)
    buckets.foreach( bucket => {
      val entry = new JSONObject()
      entry.put("time",bucket.asInstanceOf[JSONObject].get("key") )
      entry.put("count",bucket.asInstanceOf[JSONObject].get("doc_count") )
      entries.add(entry)
    })

    aggregationFullResult.put("facets",newFacets)

    aggregationFullResult
  }

}

object TestFacteTranform extends App{

  val f = new FacteTranform

  val input = "{\"facets\":{\"0\":{\"date_histogram\":{\"field\":\"@timestamp\",\"interval\":\"1s\"},\"global\":true,\"facet_filter\":{\"fquery\":{\"query\":{\"filtered\":{\"query\":{\"query_string\":{\"query\":\"*\"}},\"filter\":{\"bool\":{\"must\":[{\"range\":{\"@timestamp\":{\"from\":1453360213393,\"to\":1453361113393}}},{\"range\":{\"@timestamp\":{\"from\":1453360329661,\"to\":1453360555801}}}]}}}}}}}},\"size\":0}"

  println(f.transform(input))

  val outout = "{\n  \"took\": 355,\n  \"timed_out\": false,\n  \"_shards\": {\n    \"total\": 416,\n    \"successful\": 416,\n    \"failed\": 0\n  },\n  \"hits\": {\n    \"total\": 3157740,\n    \"max_score\": 0,\n    \"hits\": [\n      \n    ]\n  },\n  \"aggregations\": {\n    \"fquery\": {\n      \"doc_count\": 22,\n      \"terms\": {\n        \"doc_count_error_upper_bound\": 0,\n        \"sum_other_doc_count\": 0,\n        \"buckets\": [\n          {\n            \"key\": \"request\",\n            \"doc_count\": 22\n          }\n        ]\n      }\n    }\n  }\n}"

  println(f.toResult(outout))

}

object TestHistogramFacetTransformer extends App{

  val f = new HistogramFacetTransformer

  val input = "{\n  \"facets\": {\n    \"0\": {\n      \"date_histogram\": {\n        \"field\": \"@timestamp\",\n        \"interval\": \"100s\"\n      },\n      \"global\": true,\n      \"facet_filter\": {\n        \"fquery\": {\n          \"query\": {\n            \"filtered\": {\n              \"query\": {\n                \"query_string\": {\n                  \"query\": \"*\"\n                }\n              },\n              \"filter\": {\n                \"bool\": {\n                  \"must\": [\n                    {\n                      \"range\": {\n                        \"@timestamp\": {\n                          \"from\": 1453360213393,\n                          \"to\": 1453361113393\n                        }\n                      }\n                    },\n                    {\n                      \"range\": {\n                        \"@timestamp\": {\n                          \"from\": 1453360329661,\n                          \"to\": 1453360555801\n                        }\n                      }\n                    }\n                  ]\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  },\n  \"size\": 0\n}"

  println(f.transform(input))

  val outout = "{\n  \"took\": 203,\n  \"timed_out\": false,\n  \"_shards\": {\n    \"total\": 416,\n    \"successful\": 416,\n    \"failed\": 0\n  },\n  \"hits\": {\n    \"total\": 3158137,\n    \"max_score\": 0,\n    \"hits\": [\n      \n    ]\n  },\n  \"aggregations\": {\n    \"fquery\": {\n      \"0\": {\n        \"buckets\": [\n          {\n            \"key_as_string\": \"2016-01-21T07:11:40.000Z\",\n            \"key\": 1453360300000,\n            \"doc_count\": 2\n          },\n          {\n            \"key_as_string\": \"2016-01-21T07:13:20.000Z\",\n            \"key\": 1453360400000,\n            \"doc_count\": 13\n          },\n          {\n            \"key_as_string\": \"2016-01-21T07:15:00.000Z\",\n            \"key\": 1453360500000,\n            \"doc_count\": 9\n          }\n        ]\n      },\n      \"doc_count\": 24\n    }\n  }\n}"

  println(f.toResult(outout))

}

