/*
 * Show table of eventlogs
*/

G.defineControl("EventLogsViewer", {
    _init: function(eventLogs) {
        _this.createFields({
            "eventLogs": eventLogs
        });
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.append(
            elems.eventLogsSection = $DIV()
        );

        var headerCSS = {
            "font-weight": "bold",
            "border-bottom": "1px solid #CCC"
        };
        var cells = [
            $TD().css(headerCSS).text("Timestamp"),
            $TD().css(headerCSS).text("User"),
            $TD().css(headerCSS).text("Event"),
            $TD().css(headerCSS).text("Browser"),
            $TD().css(headerCSS).text("Path/Referer/IP/Local"),
            $TD().css(headerCSS).text("Params")
        ];

        $.each(_this.eventLogs, function(i, eventLog) {
            cells.push(
                $TD().text(
                    G.util.timestamp(eventLog.addDT, "MM/dd/yyyy hh:mm:sstt")
                )
            );

            var userCell = $TD();
            if (eventLog.user) {
                userCell.append(eventLog.user.makeThumbnail(true));
            } else if (eventLog.ipAddress) {
                userCell.append(
                    $SPAN().text(eventLog.ipAddress),
                    $BR(),
                    $SPAN().text((eventLog.sessionKey || "").substring(0, 5))
                );
            } else if (eventLog.sessionKey) {
                userCell.text(eventLog.sessionKey.substring(0, 5));
            } else {
                userCell.css({
                    "font-style": "italic",
                    "color": G.colors.gray
                }).text("Unknown");
            }
            cells.push(userCell);

            var eventNameCell = $TD().css({
                "font-weight": "bold"
            });
            eventNameCell.text(eventLog.name);
            cells.push(eventNameCell);

            var userAgentCell = $TD();
            if (eventLog.userAgent) {
                userAgentCell.append(
                    G.util.makeShortenedText(
                        eventLog.getParsedUserAgent() || "???",
                        eventLog.userAgent
                    )
                );
            } else {
                userAgentCell.css({
                    "font-style": "italic",
                    "color": G.colors.gray
                }).text("Unknown");
            }
            cells.push(userAgentCell);

            var netCell = $TD();
            if (eventLog.path) {
                netCell.append(
                    G.util.makeShortenedLink(
                        G.util.shortenText(eventLog.path, 40),
                        eventLog.path
                    ),
                    $BR()
                );
            }
            if (eventLog.referer) {
                netCell.append(
                    G.util.makeShortenedLink(
                        G.util.shortenText(eventLog.referer, 40),
                        eventLog.referer
                    )
                );
            } else {
                netCell.append($SPAN().css({
                        "font-style": "italic",
                        "color": G.colors.gray
                    }).text("Unknown")
                );
            }
            netCell.append($BR());
            if (eventLog.ipAddress) {
                netCell.append($SPAN().text(eventLog.ipAddress));
            } else {
                netCell.append($SPAN().css({
                        "font-style": "italic",
                        "color": G.colors.gray
                    }).text("Unknown")
                );
            }
            netCell.append($BR());
            if (eventLog.localHost) {
                netCell.append($SPAN().text(eventLog.localHost));
            } else {
                netCell.append($SPAN().css({
                        "font-style": "italic",
                        "color": G.colors.gray
                    }).text("Unknown")
                );
            }
            cells.push(netCell);

            var interestingDynamicFieldNames = null;
            var boringDynamicFieldNames = ["origin"];

            if (eventLog.name == "search") {
                interestingDynamicFieldNames = ["elapsed"];
            }

            if (interestingDynamicFieldNames) {
                interestingDynamicFieldNames = G.util.makeSet(interestingDynamicFieldNames);
            }
            if (boringDynamicFieldNames) {
                boringDynamicFieldNames = G.util.makeSet(boringDynamicFieldNames);
            }

            var interestingDynamicFields = G.util.filterDict(eventLog.dynamicFields, function(fieldName, value) {
                if (interestingDynamicFieldNames) {
                    if (!(interestingDynamicFieldNames[fieldName] && eventLog.dynamicFields[fieldName] != null)) {
                        return false;
                    }
                }
                if (boringDynamicFieldNames) {
                    if (boringDynamicFieldNames[fieldName]) {
                        return false;
                    }
                }
                return true;
            });

            var dynamicFieldsCell = $TD().append(
                G.util.makeShortenedText(
                    G.util.objToStr(G.util.mapDict(
                        interestingDynamicFields,
                        function(value) {
                            if (typeof value == "string") {
                                return G.util.shortenText("" + value, 20);
                            } else {
                                return value;
                            }
                        }
                    )),
                    G.util.objToStr(interestingDynamicFields)
                )
            );
            cells.push(dynamicFieldsCell);
        });

        elems.eventLogsSection.append(
            G.util.makeTable(cells, 6).attr("cellpadding", 6)
        );
    }
});
