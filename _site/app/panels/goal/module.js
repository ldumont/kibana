/*! kibana - v3.1.3 - 2016-11-07
 * Copyright (c) 2016 Rashid Khan; Licensed Apache-2.0 */

define("panels/goal/module",["angular","app","lodash","jquery","kbn","config","chromath"],function(a,b,c,d,e){"use strict";var f=a.module("kibana.panels.goal",[]);b.useModule(f),f.controller("goal",["$scope","$rootScope","querySrv","dashboard","filterSrv",function(b,d,e,f,g){b.panelMeta={editorTabs:[{title:"Queries",src:"app/partials/querySelect.html"}],modals:[{description:"Inspect",icon:"icon-info-sign",partial:"app/partials/inspector.html",show:b.panel.spyable}],status:"Stable",description:"Displays the progress towards a fixed goal on a pie chart"};var h={donut:!0,tilt:!1,legend:"above",labels:!0,spyable:!0,query:{goal:100},queries:{mode:"all",ids:[]}};c.defaults(b.panel,h),b.init=function(){b.$on("refresh",function(){b.get_data()}),b.get_data()},b.set_refresh=function(a){b.refresh=a},b.close_edit=function(){b.refresh&&b.get_data(),b.refresh=!1,b.$emit("render")},b.get_data=function(){if(0!==f.indices.length){b.panelMeta.loading=!0;var d=b.ejs.Request().indices(f.indices);b.panel.queries.ids=e.idsByMode(b.panel.queries);var h=e.getQueryObjs(b.panel.queries.ids),i=b.ejs.BoolQuery();c.each(h,function(a){i=i.should(e.toEjsObj(a))});var j;d=d.query(i).filter(g.getBoolFilter(g.ids())).size(0),b.inspector=a.toJson(JSON.parse(d.toString()),!0),j=d.doSearch(),j.then(function(a){b.panelMeta.loading=!1;var c=a.hits.total,d=b.panel.query.goal-c;b.data=[{label:"Complete",data:c,color:e.colors[parseInt(b.$id,16)%8]},{data:d,color:Chromath.lighten(e.colors[parseInt(b.$id,16)%8],.7).toString()}],b.$emit("render")})}}}]),f.directive("goal",["querySrv",function(a){return{restrict:"A",link:function(b,f){function g(){f.css({height:b.panel.height||b.row.height});var e;e={show:b.panel.labels,radius:0,formatter:function(a,d){var e=parseInt((b.panel.height||b.row.height).replace("px",""),10)/8+String("px");return c.isUndefined(a)?"":'<div style="font-size:'+e+';font-weight:bold;text-align:center;padding:2px;color:#fff;">'+Math.round(d.percent)+"%</div>"}};var g={series:{pie:{innerRadius:b.panel.donut?.45:0,tilt:b.panel.tilt?.45:1,radius:1,show:!0,combine:{color:"#999",label:"The Rest"},label:e,stroke:{width:0}}},grid:{backgroundColor:null,hoverable:!0,clickable:!0},legend:{show:!1},colors:a.colors};f.is(":visible")&&require(["jquery.flot.pie"],function(){b.legend=d.plot(f,b.data,g).getData(),b.$$phase||b.$apply()})}f.html('<center><img src="img/load_big.gif"></center>'),b.$on("render",function(){g()});var h=d("<div>");f.bind("plothover",function(a,b,c){c?h.html([e.query_color_dot(c.series.color,15),e.xmlEnt(c.series.label||""),parseFloat(c.series.percent).toFixed(1)+"%"].join(" ")).place_tt(b.pageX,b.pageY,{offset:10}):h.remove()})}}}])});