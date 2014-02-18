/*
 * The facade of the atlas-cesium implementation.
 */
define([
  'atlas/util/DeveloperError',
  'atlas/util/Extends',
  'atlas-cesium/camera/CameraManager',
  'atlas-cesium/dom/DomManager',
  'atlas/edit/EditManager',
  'atlas-cesium/entity/EntityManager',
  'atlas/events/EventManager',
  'atlas-cesium/input/InputManager',
  'atlas-cesium/render/RenderManager',
  'atlas/selection/SelectionManager',
  'atlas/visualisation/VisualisationManager',
  'atlas-cesium/model/Feature',
  'atlas-cesium/model/Polygon',
  // Extends
  'atlas/core/Atlas',
  'atlas/lib/utility/Log'
], function(DeveloperError, extend, CameraManager, DomManager, EditManager, EntityManager,
            EventManager, InputManager, RenderManager, SelectionManager, VisualisationManager,
            Feature, Polygon, Atlas, Log) {

  var CesiumAtlas = function() {
    // Call the atlas.core.Atlas constructor.
    CesiumAtlas.base.constructor.call(this);

    // Create all the atlas manager objects before initialising any. Any initialisation work
    // that requires the presence of a particular manager is done in <code>setup()</code>,
    // so the managers may be created in any order.
    this._managers.edit = new EditManager(this._managers);
    this._managers.entity = new EntityManager(this._managers);
    this._managers.event = new EventManager(this._managers);
    this._managers.render = new RenderManager(this._managers);
    this._managers.dom = new DomManager(this._managers);
    this._managers.selection = new SelectionManager(this._managers);
    this._managers.input = new InputManager(this._managers);
    this._managers.camera = new CameraManager(this._managers);
    this._managers.visualisation = new VisualisationManager(this._managers);

    // Setup the manager objects. These are independent unless stated otherwise.
    this._managers.camera.setup();
    this._managers.edit.setup();
    this._managers.render.setup();
    this._managers.entity.setup({constructors: {"Feature": Feature, "Polygon": Polygon}});
    //this._managers.input.setup(); // Initialise the InputManager after the DOM is set.
    this._managers.selection.setup();
    this._managers.visualisation.setup();

    /**
     * Contains a map of event name to EventHandler object.
     * @type {Object}
     * @private
     */
    this._eventHandlers = {};

    // And finally hook CesiumAtlas into any global events.
    this.bindEvents();
  };
  // Extend from atlas.core.Atlas.
  extend(Atlas, CesiumAtlas);

  /**
   * Attaches the CesiumAtlas instance to a particular DOM element.
   * @param {String|HTMLElement} elem - The DOM element to attach to.
   */
  CesiumAtlas.prototype.attachTo = function(elem) {
    this._managers.dom.setDom(elem, true);
    // Hook up the InputManager to the selected DOM element.
    this._managers.input.setup(elem);
  };

  /**
   * Registers event handlers with the EventManager for global events.
   */
  CesiumAtlas.prototype.bindEvents = function() {
    var entityManager = this._managers.entity;
    var handlerParams = [
      { // Define an event handler for showing an entity.
        source: 'extern',
        name: 'entity/show',
        callback: function(args) {
          Log.time('entity/show');
          var entity = entityManager.getById(args.id);
          (!entity) && (entity = entityManager.createFeature(args.id, args));
          entity.show();
          Log.timeEnd('entity/show');
        }.bind(this)
      },
      { // Define an event handler for hiding an entity.
        source: 'extern',
        name: 'entity/hide',
        callback: function(args) {
          Log.time('entity/hide');
          var entity = entityManager.getById(args.id);
          entity.hide();
          Log.timeEnd('entity/hide');
        }.bind(this)
      }/*,
       // TODO(bpstudds): Move Overlay testing code somewhere intelligent.
       {
       source: 'intern',
       name: 'input/leftup',
       callback: function (args) {
       Log.debug('trying to show overlay');
       if (this.overlay !== undefined) this.overlay.hide();
       this.overlay = new Overlay(this._currentDomId,
       {
       top: args.y,
       left: args.x
       },
       '<p>x:' + args.x + ' y:' + args.y + '</p>'
       );
       this.overlay.show();
       }.bind(this._managers.dom)
       }*/
    ];
    // Add the event handlers to the EventManager.
    this._eventHandlers = this._managers.event.addEventHandlers(handlerParams);
  };

  return CesiumAtlas;
});
