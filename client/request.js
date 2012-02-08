function request(options, callback) {
  $.jsonp({
    "url": options.url,
    callbackParameter: "callback",
    "success": function(data, textStatus, jqXHR) {
      if (typeof data == 'string') data = jQuery.parseJSON(data);
      callback && callback(null, {statusCode: 200}, data);
    },
    "error": function(d) {
        alert("fuck");
    }
  });
}