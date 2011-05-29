/*
 * Edit an entity list
*/

G.defineControl("EntityListEditor", {
    /*
     * EntityListEditor must be used as a base class.
     *
     * Its child class must set these instance attributes:
     *
     *   entityClass: A G.Data subclass
     *
     *   suggestionType: If entities support lookup by name, this parameter will be passed to their autosuggest
     *
     *   _makeEntityViewer: function(entity, isAdded)
     *     isAdded: true if entityViewer is wrapping an entity that has been added to the official list
     *     Returns a G.Controls subclass with methods
     *       findAndLoad(text) (only if entities support lookup by name): loads an entity from the server
     *       getValidInput(): returns an entity or null
     *     and events:
     *       load(loadedEntity, entityQ) (only if entities support lookup by name)
     *
     *     If isAdded is true, it means the entity has been confirmed as part of the list.
     *     The "entity" argument is either the output of another entityViewer's getValidInput(),
     *     or a new entityClass.
     *
     * The child class is allowed and encouraged to override any instance method.
    */

    _init: function(entities) {
        // Properties
        _this.createFields({
            "allowCreate": false, // allow user to add new entity
            "confirmNew": false, // ask user to confirm adding new entity
            "allowRemove": true, // allow entities to be removed from list
            "label": ""
        });

        _this.createField("controls", {
            "autoSuggest": null,
            "entityViewers": [],
            "newEntityViewers": null,
            "addButton": new G.controls.Button().set({
                "text": "Add"
            }).bind({
                "click": _this.submitEntity
            })
        });

        if (entities) {
            _this._set_entities(entities);
        }

        _this.createEvents("addEntity");
    },

    _verifyLoadedEntity: function(entity, q) {
        var existingEntityIndex = $.inArray(entity, _this.entities);

        if (!entity) {
            G.util.alertOops("\"" + q + "\" was not found.");
            return false;

        } else if (existingEntityIndex >= 0) {
            var existingEntity = _this.entities[existingEntityIndex];
            G.util.alertOops("\"" + existingEntity.name + "\" is a duplicate.");
            return false;
        }

        return true;
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.append(
            G.util.makeTable([
                $TD().append(
                    elems.label = $DIV().css({
                        "margin-right": _this.label? 8 : 0
                    }).text(_this.label)
                ),
                $TD().append(
                    elems.autoSuggest = $DIV()
                ),
                $TD().append(
                    elems.createLinkSection = $DIV().css({
                        "margin-left": 8
                    }).append(
                        elems.orCreate = G.util.nbSpan("or "),
                        G.util.makeLink("Create", _this.func(function() {
                            _this.addEntity(new _this.entityClass(), true);
                        })).css({
                            "font-size": 14
                        })
                    ).hide()
                )
            ]),
            elems.sectionDiv = $DIV().css({
                "font-size": 12
            })
        );

        if (_this.suggestionType !== undefined) {
            // Support looking up elements by name
            _this.controls.autoSuggest = new G.controls.AutoSuggest(_this.suggestionType).set({
                "buttonText": "Find"
            }).style({
                "buttonWidth": 60
            }).bind({
                "select": _this.func(function(text, suggestion) {
                    this.setText("");
                    _this.controls.newEntityViewer.findAndLoad(suggestion ? suggestion.id : null, text);
                    _this.render("loadingEntity");
                })
            }).renderTo(elems.autoSuggest);
        } else {
            elems.orCreate.hide();
        }

        if (_this.allowCreate) {
            elems.createLinkSection.show();
        }

        var newEntityViewerDiv;
        var newButtonsDiv;

        $.extend(_this.render, {
            addExistingEntityViewer: function(entityViewer, focus) {
                var sectionId = entityViewer._controlId;

                // Add an entityViewer at top of list
                elems.sectionDiv.prepend(
                    elems["entityViewer" + sectionId] = $DIV().css({
                        "margin-left": 12,
                        "margin-bottom": 8,
                        "border-top": "1px solid #CCC",
                        "padding-top": 6
                    }).append(
                        $A().attr("name", "entityListEditor" + _this._controlId + "Section" + sectionId),
                        G.util.makeTable([
                            $TD().append(
                                elems["entityViewerLeft" + sectionId] = entityViewer.renderHere().css({
                                    "padding-right": 12
                                })
                            ),
                            $TD().append(
                                elems["removeSection" + sectionId] = $DIV().css({
                                    "padding-left": 12
                                }).append(
                                    G.util.makeLink("Remove", _this.func(function() {
                                        _this.removeEntitySection(sectionId);
                                    }))
                                )
                            )
                        ])
                    )
                );

                if (_this.allowRemove) {
                    elems["entityViewerLeft" + sectionId].css({
                        "border-right": "1px solid #CCC"
                    });
                } else {
                    elems["removeSection" + sectionId].hide();
                }

                if (focus) {
                    entityViewer.focus();
                }
            },

            removeSection: function(sectionId) {
                elems["entityViewer" + sectionId].remove();
            },

            addNewEntityViewer: function() {
                // Add new hidden entityViewer at top of list

                _this.controls.newEntityViewer = _this._makeEntityViewer(new _this.entityClass(), false);

                var sectionId = _this.controls.newEntityViewer._controlId;

                if (_this.suggestionType !== undefined) {
                    _this.controls.newEntityViewer.bind({
                        "load": _this.func(function(loadedEntity, entityQ) {
                            if (!_this._verifyLoadedEntity(loadedEntity, entityQ)) {
                                newEntityViewerDiv.hide();
                                return;
                            }

                            newButtonsDiv.show();

                            if (!_this.confirmNew) {
                                _this.submitEntity();
                            }
                        })
                    });
                }

                if (newEntityViewerDiv) {
                    // Remove old (possibly used-up) newEntityViewerDiv
                    newEntityViewerDiv.remove();
                }

                elems.sectionDiv.prepend(
                    newEntityViewerDiv = elems["entityViewer" + sectionId] = $DIV().css({
                        "float": "left",
                        "margin-left": 12,
                        "margin-top": 8,
                        "margin-bottom": 8,
                        "padding": 8,
                        "background-color": "#F8F8F8",
                        "border": "1px solid black"
                    }).append(
                        _this.controls.newEntityViewer.renderHere(),
                        newButtonsDiv = elems["buttonsSection" + sectionId] = $DIV().css({
                            "margin-top": 8,
                            "border-top": "1px solid #999",
                            "padding-top": 6
                        }).append(
                            _this.controls.addButton.renderHere().css({
                                "float": "left",
                                "margin-right": 8
                            }),
                            G.util.makeLink("Cancel", _this.func(function() {
                                newEntityViewerDiv.hide();
                            })).css({
                                "float": "left",
                                "margin-top": 4
                            }),
                            $DIV().css("clear","both")
                        )
                    ).hide(),
                    $DIV().css("clear","both")
                );
            },

            loadingEntity: function() {
                newEntityViewerDiv.show();
                newButtonsDiv.hide();
            }
        });

        $.each(_this.controls.entityViewers, function(i, entityViewer) {
            _this.render("addExistingEntityViewer", entityViewer);
        });

        _this.render("addNewEntityViewer");
    },

    addEntity: function(entity, focus) {
        // Add an entity to the list and update the UI

        // Add this entity to the top of the list
        var entityViewer = _this._makeEntityViewer(entity, true);
        _this.controls.entityViewers.push(entityViewer);
        _this.render("addExistingEntityViewer", entityViewer, focus);

        // Be ready to accept another new entity
        _this.render("addNewEntityViewer");
    },

    removeEntitySection: function(sectionId) {
        var entityViewer = G._controlInstances[sectionId];

        var index = $.inArray(entityViewer, _this.controls.entityViewers);
        G.assert(index >= 0);

        _this.controls.entityViewers.splice(index, 1);

        _this.render("removeSection", sectionId);
    },

    getValidInput: function() {
        var entities = [];

        var ok = true;
        $.each(_this.controls.entityViewers, function(i, entityViewer) {
            var inputtedEntity = entityViewer.getValidInput();
            if (inputtedEntity) {
                entities.push(inputtedEntity);
            } else {
                ok = false;
                // Keep looping to trigger all validation UI
            }
        });

        if (ok) {
            return entities;
        } else {
            return null;
        }
    },

    submitEntity: function() {
        var entity = _this.controls.newEntityViewer.getValidInput();
        if (!entity) {
            return;
        }

        _this.addEntity(entity);

        _this.controls.entityViewers[_this.controls.entityViewers.length-1].focus();
    },

    focus: function() {
        if (_this.controls.autoSuggest) {
            _this.controls.autoSuggest.focus();
        }
    },

    scrollToSection: function(sectionId) {
        window.location.hash = "entityListEditor" + _this._controlId + "Section" + sectionId;
    },

    showValMsg: function(msg, color) {
        _this.controls.autoSuggest.showValMsg(msg, color);
    },

    _set_entities: function(entities) {
        _this.controls.entityViewers = [];
        $.each(entities, function(i, entity) {
            _this.controls.entityViewers.push(
                _this._makeEntityViewer(entity, true)
            );
        });
    }
});
