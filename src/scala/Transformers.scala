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
    termsP.put("terms",terms)
    termsP
  }

  def isFacetsTerms(str : String) : Boolean= {
    if (str == null || str.isEmpty) return false
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
    if (str == null || str.isEmpty) return false
    val asJSON = JSONValue.parseWithException(str).asInstanceOf[JSONObject]
    val facets = getAsJSON(asJSON,"facets")
    val zero = getAsJSON(facets,"0")
    zero != null
  }

  def build(filter: JSONObject, dataHistogram: JSONObject, number: String) = {

    val fQuery = new JSONObject()
    val innerAggs = new JSONObject()
    val histogramZero = new JSONObject()
    val outer = new JSONObject()
    //val outerFquery = new JSONObject()

    //outerFquery.put("fquery_"+number, fQuery)
    fQuery.put("filter",filter)
    fQuery.put("aggs", outer)
    outer.put(number,histogramZero)
    histogramZero.put("date_histogram", dataHistogram)

    fQuery

  }

  def transform(str : String) : String = {
    val result = new JSONObject()
    val aggs = new JSONObject()
    result.put("aggs",aggs)
    val asJSON = JSONValue.parseWithException(str).asInstanceOf[JSONObject]
    result.put("size",asJSON.get("size"))
    val facets = getAsJSON(asJSON,"facets")
    facets.keySet().foreach(number => {
      val zero = getAsJSON(facets,number)
      val dataHistogram  = getAsJSON( zero, "date_histogram")
      val facetFilter = getAsJSON(zero,"facet_filter")
      val fQuery= getAsJSON(facetFilter,"fquery")
      aggs.put("fquery_"+number, build(fQuery, dataHistogram, number))
    })
    result.toString()
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

    val newFacets = new JSONObject()



    aggregations.keySet().foreach{ key =>
      val newNumber = new JSONObject()
      val entries = new JSONArray

      val fquery = getAsJSON(aggregations, key)
      //assuming there is only one !!!
      val number = fquery.keySet().iterator().next()
      val oldNumberValue = getAsJSON(fquery, number)
      val buckets = getAsArray(oldNumberValue, "buckets")


      newNumber.put("_type","date_histogram")
      newNumber.put("entries",entries)
      buckets.foreach( bucket => {
        val entry = new JSONObject()
        entry.put("time",bucket.asInstanceOf[JSONObject].get("key") )
        entry.put("count",bucket.asInstanceOf[JSONObject].get("doc_count") )
        entries.add(entry)
      })
      newFacets.put(number, newNumber)
    }
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

  val input = "{\"facets\":{\"0\":{\"date_histogram\":{\"field\":\"@timestamp\",\"interval\":\"10s\"},\"global\":true,\"facet_filter\":{\"fquery\":{\"query\":{\"filtered\":{\"query\":{\"query_string\":{\"query\":\"*\"}},\"filter\":{\"bool\":{\"must\":[{\"range\":{\"@timestamp\":{\"from\":1453974103164,\"to\":1453975003164}}}]}}}}}}}},\"size\":0}"

  println(f.transform(input))

  //val outout = "{\n  \"took\": 203,\n  \"timed_out\": false,\n  \"_shards\": {\n    \"total\": 416,\n    \"successful\": 416,\n    \"failed\": 0\n  },\n  \"hits\": {\n    \"total\": 3158137,\n    \"max_score\": 0,\n    \"hits\": [\n      \n    ]\n  },\n  \"aggregations\": {\n    \"fquery\": {\n      \"0\": {\n        \"buckets\": [\n          {\n            \"key_as_string\": \"2016-01-21T07:11:40.000Z\",\n            \"key\": 1453360300000,\n            \"doc_count\": 2\n          },\n          {\n            \"key_as_string\": \"2016-01-21T07:13:20.000Z\",\n            \"key\": 1453360400000,\n            \"doc_count\": 13\n          },\n          {\n            \"key_as_string\": \"2016-01-21T07:15:00.000Z\",\n            \"key\": 1453360500000,\n            \"doc_count\": 9\n          }\n        ]\n      },\n      \"doc_count\": 24\n    }\n  }\n}"
  val outout = "{\n    \"took\": 28,\n    \"timed_out\": false,\n    \"_shards\": {\n        \"total\": 104,\n        \"successful\": 104,\n        \"failed\": 0\n    },\n    \"hits\": {\n        \"total\": 985652,\n        \"max_score\": 0,\n        \"hits\": []\n    },\n    \"aggregations\": {\n        \"fquery_0\": {\n            \"0\": {\n                \"buckets\": [\n                    {\n                        \"key_as_string\": \"2016-01-28T09:54:40.000Z\",\n                        \"key\": 1453974880000,\n                        \"doc_count\": 2\n                    },\n                    {\n                        \"key_as_string\": \"2016-01-28T09:55:20.000Z\",\n                        \"key\": 1453974920000,\n                        \"doc_count\": 1\n                    }\n                ]\n            },\n            \"doc_count\": 3\n        }\n    }\n}"

  println(f.toResult(outout))

}


object TestHistogramFacetTransformer3 extends App{

  val f = new HistogramFacetTransformer

  val input = "{\"facets\":{\"0\":{\"date_histogram\":{\"field\":\"@timestamp\",\"interval\":\"10s\"},\"global\":true,\"facet_filter\":{\"fquery\":{\"query\":{\"filtered\":{\"query\":{\"query_string\":{\"query\":\"*\"}},\"filter\":{\"bool\":{\"must\":[{\"range\":{\"@timestamp\":{\"from\":1453973995625,\"to\":1453974895625}}}]}}}}}}},\"1\":{\"date_histogram\":{\"field\":\"@timestamp\",\"interval\":\"10s\"},\"global\":true,\"facet_filter\":{\"fquery\":{\"query\":{\"filtered\":{\"query\":{\"query_string\":{\"query\":\"@type:\\\"syslog\\\"\"}},\"filter\":{\"bool\":{\"must\":[{\"range\":{\"@timestamp\":{\"from\":1453973995625,\"to\":1453974895625}}}]}}}}}}},\"2\":{\"date_histogram\":{\"field\":\"@timestamp\",\"interval\":\"10s\"},\"global\":true,\"facet_filter\":{\"fquery\":{\"query\":{\"filtered\":{\"query\":{\"query_string\":{\"query\":\"@type:\\\"log4net\\\"\"}},\"filter\":{\"bool\":{\"must\":[{\"range\":{\"@timestamp\":{\"from\":1453973995625,\"to\":1453974895625}}}]}}}}}}},\"3\":{\"date_histogram\":{\"field\":\"@timestamp\",\"interval\":\"10s\"},\"global\":true,\"facet_filter\":{\"fquery\":{\"query\":{\"filtered\":{\"query\":{\"query_string\":{\"query\":\"@type:\\\"request\\\"\"}},\"filter\":{\"bool\":{\"must\":[{\"range\":{\"@timestamp\":{\"from\":1453973995625,\"to\":1453974895626}}}]}}}}}}}},\"size\":0}"

  println(f.transform(input))

  val outout = "{\n    \"took\": 103,\n    \"timed_out\": false,\n    \"_shards\": {\n        \"total\": 104,\n        \"successful\": 104,\n        \"failed\": 0\n    },\n    \"hits\": {\n        \"total\": 985652,\n        \"max_score\": 0,\n        \"hits\": []\n    },\n    \"aggregations\": {\n        \"fquery_0\": {\n            \"0\": {\n                \"buckets\": [\n                    {\n                        \"key_as_string\": \"2016-01-28T09:54:40.000Z\",\n                        \"key\": 1453974880000,\n                        \"doc_count\": 2\n                    }\n                ]\n            },\n            \"doc_count\": 2\n        },\n        \"fquery_1\": {\n            \"1\": {\n                \"buckets\": []\n            },\n            \"doc_count\": 0\n        },\n        \"fquery_2\": {\n            \"2\": {\n                \"buckets\": []\n            },\n            \"doc_count\": 0\n        },\n        \"fquery_3\": {\n            \"3\": {\n                \"buckets\": [\n                    {\n                        \"key_as_string\": \"2016-01-28T09:54:40.000Z\",\n                        \"key\": 1453974880000,\n                        \"doc_count\": 2\n                    }\n                ]\n            },\n            \"doc_count\": 2\n        }\n    }\n}"

  println(f.toResult(outout))

}

