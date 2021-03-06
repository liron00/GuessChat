/*
 * Javascript Humane Dates
 * Copyright (c) 2008 Dean Landolt (deanlandolt.com)
 * Re-write by Zach Leatherman (zachleat.com)
 * 
 * Adopted from the John Resig's pretty.js
 * at http://ejohn.org/blog/javascript-pretty-date
 * and henrah's proposed modification 
 * at http://ejohn.org/blog/javascript-pretty-date/#comment-297458
 * 
 * Licensed under the MIT license.
 */

(function() {
    function humane_date(d){
        var time_formats = [
            [1.5, '1 Second'],
            [60, 'Seconds', 1],
            [90, '1 Minute'],
            [3600, 'Minutes', 60], // 60*60, 60
            [5400, '1 Hour'], // 60*60*1.5
            [86400, 'Hours', 3600], // 60*60*24, 60*60
            [129600, '1 Day'], // 60*60*24*1.5
            [604800, 'Days', 86400], // 60*60*24*7, 60*60*24
            [907200, '1 Week'], // 60*60*24*7*1.5
            [2628000, 'Weeks', 604800], // 60*60*24*(365/12), 60*60*24*7
            [3942000, '1 Month'], // 60*60*24*(365/12)*1.5
            [31536000, 'Months', 2628000], // 60*60*24*365, 60*60*24*(365/12)
            [47304000, '1 Year'], // 60*60*24*365*1.5
            [3153600000, 'Years', 31536000], // 60*60*24*365*100, 60*60*24*365
            [4730400000, '1 Century'], // 60*60*24*365*100*1.5
        ];

        var time = d,
            dt = new Date,
            seconds = ((dt - time) / 1000),
            token = ' Ago',
            i = 0,
            format;

        if (seconds < 0) {
            seconds = Math.abs(seconds);
            token = '';
        }

        while (format = time_formats[i++]) {
            if (seconds < format[0]) {
                if (format.length == 2) {
                    return format[1] + token;
                } else {
                    return Math.round(seconds / format[2]) + ' ' + format[1] + token;
                }
            }
        }

        // overflow for centuries
        if(seconds > 4730400000)
            return Math.round(seconds / 4730400000) + ' Centuries' + token;

    };

    if(typeof jQuery != 'undefined') {
        jQuery.fn.prettyDate = function(d){
            return this.each(function(){
                var prettyD = humane_date(d).toLowerCase();
                if(jQuery(this).text() != prettyD) // don't modify the dom if we don't have to
                    jQuery(this).text(prettyD);

                var fullDateStr = d.toString();
                if(jQuery(this).attr("title") != fullDateStr) {
                    jQuery(this).attr("title", fullDateStr); // don't modify the dom if we don't have to
                }
            });
        };
    }
})();
