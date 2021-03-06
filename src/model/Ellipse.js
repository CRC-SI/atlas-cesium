define([
  'atlas/lib/utility/Log',
  'atlas/util/AtlasMath',
  'atlas-cesium/cesium/Source/Core/EllipseGeometry',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/cesium/Source/Scene/MaterialAppearance',
  'atlas-cesium/cesium/Source/Core/Color',
  // Base class
  'atlas/model/Ellipse'
], function(Log, AtlasMath, EllipseGeometry, GeometryInstance, Primitive, MaterialAppearance,
            CesiumColor, EllipseCore) {

  var Ellipse = EllipseCore.extend(/** @lends atlas-cesium.model.Ellipse# */ {

    /**
     * The Cesium GeometryInstance of the Ellipse.
     * @type {GeometryInstance}
     * @private
     */
    _geometry: null,

    /**
     * The Cesium appearance data of the Ellipse.
     * @type {EllipsoidSurfaceAppearance|MaterialAppearance}
     * @private
     */
    _appearance: null,

    /**
     * The Cesium Primitive instance of the Ellipse, used to render the Ellipse in Cesium.
     * @type {Primitive}
     * @private
     */
    _primitive: null,

    /**
     * The minimum terrain elevation underneath the Ellipse.
     * @type {Number}
     */
    _minTerrainElevation: 0.0,

    /**
     * The RenderManager rendering this Ellipse.
     * @type {atlas-cesium.render.RenderManager}
     */
    _renderManager: null,

    // -------------------------------------------
    // GETTERS AND SETTERS
    // -------------------------------------------

    /**
     * Returns whether this Ellipse is visible. Overrides the default Atlas implementation
     * to use the visibility flag that is set of the Cesium Primitive of the Ellipse.
     * @returns {Boolean} - Whether the Ellipse is visible.
     */
    isVisible: function() {
      return this._primitive && this._primitive.show === true;
    },

    // -------------------------------------------
    // MODIFIERS
    // -------------------------------------------

    /**
     * Generates the data structures required to render a Ellipse
     * in Cesium.
     */
    _createPrimitive: function() {
      Log.debug('creating primitive for entity', this.getId());
      this._geometry = this._updateGeometry();
      this._appearance = this._updateAppearance();
      return new Primitive({
        geometryInstances: this.getGeometry(),
        appearance: this.getAppearance(),
        debugShowBoundingVolume: false
      });
    },

    /**
     * Updates the geometry data as required.
     * @returns {GeometryInstance}
     * @private
     */
    _updateGeometry: function() {
      // Generate new cartesians if the vertices have changed.
      if (this.isDirty('entity') || this.isDirty('model') || !this._geometry) {
        Log.debug('updating geometry for entity ' + this.getId());
        this._minTerrainElevation = this._renderManager.getMinimumTerrainHeight(this._vertices) || 0.0;
        // TODO(aramk) The zIndex is currently absolute, not relative to the parent or using bins.
        var elevation = this._minTerrainElevation + this._elevation +
          this._zIndex * this._zIndexOffset;
            // Generate new geometry data.
        return new GeometryInstance({
          id: this.getId().replace('ellipse', ''),
          geometry: new EllipseGeometry({
            center: this._renderManager.cartesianFromGeoPoint(this.getCentroid()),
            semiMajorAxis: this.getSemiMajorAxis(),
            semiMinorAxis: this.getSemiMinorAxis(),
            rotation: AtlasMath.toRadians(this.getRotation()),
            height: elevation,
            //extrudedHeight: elevation + (this._showAsExtrusion ? this._height : 0),
            vertexFormat: MaterialAppearance.VERTEX_FORMAT
          })
        });
      }
      return this._geometry;
    },

    /**
     * Updates the appearance data.
     * @returns {MaterialAppearance}
     * @private
     */
    _updateAppearance: function() {
      if (this.isDirty('entity') || this.isDirty('style') || !this._appearance) {
        Log.debug('updating appearance for entity ' + this.getId());
        if (!this._appearance) {
          // TODO(bpstudds): Fix rendering so that 'closed' can be enabled.
          //                 This may require sorting of vertices before rendering.
          this._appearance = new MaterialAppearance({
            closed: false,
            translucent: false,
            faceForward: true
          });
        }
        this._appearance.material.uniforms.color =
            Ellipse._convertStyleToCesiumColors(this._style).fill;
      }
      return this._appearance;
    },

    /**
     * Builds the geometry and appearance data required to render the Ellipse in
     * Cesium.
     */
    _build: function() {
      if (!this._primitive || this.isDirty('vertices') || this.isDirty('model')) {
        if (this._primitive) {
          this._renderManager.getPrimitives().remove(this._primitive);
        }
        this._primitive = this._createPrimitive();
        this._renderManager.getPrimitives().add(this._primitive);
      } else if (this.isDirty('style')) {
        this._updateAppearance();
      }
    },

    _updateVisibility: function(visible) {
      if (this._primitive) this._primitive.show = visible;
    },

    /**
     * Function to permanently remove the Ellipse from the scene (vs. hiding it).
     */
    remove: function() {
      this._super();
      this.setDirty('model');
      this._primitive && this._renderManager.getPrimitives().remove(this._primitive);
    }

  });

  // -------------------------------------------
  // STATICS
  // -------------------------------------------

  /**
   * Takes an atlas Style object and converts it to Cesium Color objects.
   * @param style
   * @private
   */
  Ellipse._convertStyleToCesiumColors = function(style) {
    return {
      fill: Ellipse._convertAtlasToCesiumColor(style.getFillMaterial()),
      border: Ellipse._convertAtlasToCesiumColor(style.getBorderMaterial())
    }
  };

  /**
   * Converts an Atlas Color object to a Cesium Color object.
   * @param {atlas.material.Color} color - The Color to convert.
   * @returns {CesiumColor} The converted Cesium Color object.
   * @private
   */
  Ellipse._convertAtlasToCesiumColor = function(color) {
    if (!color) {
      return;
    }
    // TODO(bpstudds) Determine how to get Cesium working with alpha enabled.
    return new CesiumColor(color.red, color.green, color.blue, /* override alpha temporarily*/ 1);
  };

  return Ellipse;
});
