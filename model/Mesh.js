define([
  'atlas/util/DeveloperError',
  'atlas/util/Extends',
  'atlas/model/Colour',
  'atlas/model/Vertex',
  // Cesium includes
  'atlas-cesium/cesium/Source/Core/BoundingSphere',
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/ColorGeometryInstanceAttribute',
  'atlas-cesium/cesium/Source/Core/ComponentDatatype',
  'atlas-cesium/cesium/Source/Core/Geometry',
  'atlas-cesium/cesium/Source/Core/GeometryAttribute',
  'atlas-cesium/cesium/Source/Core/GeometryAttributes',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/GeometryPipeline',
  'atlas-cesium/cesium/Source/Core/Matrix4',
  'atlas-cesium/cesium/Source/Core/PrimitiveType',
  'atlas-cesium/cesium/Source/Core/Transforms',
  'atlas-cesium/cesium/Source/Scene/PerInstanceColorAppearance',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  //Base class.
  'atlas/model/Mesh'
], function (DeveloperError,
             extend,
             Color,
             Vertex,
             BoundingSphere,
             Cartographic,
             Cartesian3,
             ColorGeometryInstanceAttribute,
             ComponentDatatype,
             Geometry,
             GeometryAttribute,
             GeometryAttributes,
             GeometryInstance,
             GeometryPipeline,
             Matrix4,
             PrimitiveType,
             Transforms,
             PerInstanceColorAppearance,
             Primitive,
             MeshCore) {

  /**
   * Constructs a new Mesh object.
   * @class A Mesh represents a 3D renderable object in atlas.
   * @param {String} id - The ID of the Mesh.
   * @param {String} meshData - The data required to render the Mesh.
   * @params {Array.<Number>} meshData.geoLocation - The location of the Mesh in an [latitude, longitude, elevation] formatted array. Unique positions need to be defined for every triangle vertex to ensure shading works correctly.
   * @params {Array.<Number>} meshData.positions - A 1D array of position data, every 3 elements forming a vertex, ie a (x, y, z) coordinate tuple in model space.
   * @params {Array.<Number>} meshData.triangles - A 1D array of the triangles forming the mesh. Every 3 elements forming a new triangle with counter-clockwise winding order.
   * @params {Array.<Number>} [meshData.normals] - CURRENTLY NOT USED. A 1D array of normals for each vertex in the triangles array. Every 3 elements form an (x, y, z) vector tuple.
   * @params {Array.<Number>} [meshData.color] - The uniform colour of the Mesh, given as a [red, green, blue, alpha] formatted array.
   * @params {Array.<Number>} [meshData.scale] - The scale of the Mesh.
   * @params {Array.<Number>} [meshData.rotation] - The rotation of the Mesh.
   * @param {Object} args - Required and optional arguments to construct the Mesh object.
   * @param {String} args.id - The ID of the GeoEntity. (Optional if both <code>id</code> and <code>args</code> are provided as arguments)
   * @param {atlas/render/RenderManager} args.renderManager - The RenderManager object responsible for the GeoEntity.
   * @param {atlas/events/EventManager} args.eventManager - The EventManager object responsible for the Event system.
   * @param {atlas/events/EventTarget} [args.parent] - The parent EventTarget object of the GeoEntity.g
   *
   * @see {@link atlas/model/Mesh}
   * @see {@link atlas/model/GeoEntity}
   *
   * @alias atlas-cesium/model/Mesh
   * @extends {atlas/model/Mesh}
   * @constructor
   */
  var Mesh = function (id, meshData, args) {
    if (typeof id === 'object') {
      args = id;
      id = args.id;
    }
    // Call base class MeshCore constructor.
    Mesh.base.constructor.call(this, id, meshData, args);

    /*
     * Inherited from Mesh
     *    _id
     *    _geoLocation
     *    _scale
     *    _rotation
     *    _area
     *    _centroid
     *    _geometry
     *    _visible
     *    _renderManager
     *    _renderable
     *    _appearance
     */

    /**
     * The array of vertex positions for this Mesh, in model space coordinates.
     * This is a 1D array to conform with Cesium requirements. Every three elements of this
     * array describes a new vertex, with each element being the x, y, z component respectively.
     * @type {Array.<Number>}
     * @private
     */
    this._positions = [];
    if (meshData.positions && meshData.positions.length) {
      this._positions = new Float64Array(meshData.positions.length);
      meshData.positions.forEach(function (position, i) {
        this._positions[i] = position;
      }, this);
    }

    /**
     * The array of indices describing the 3D mesh. Every three elements of the array are grouped
     * together and describe a triangle forming the mesh. The value of the element is the index
     * of virtual positions array (the array if each element in <code>Mesh._positions</code> was
     * an (x,y,z) tuple) that corresponds to that vertex of the triangle.
     * @type {Array.<Number>}
     * @private
     */
    this._indices = [];
    if (meshData.triangles && meshData.triangles.length) {
      this._indices = new Uint16Array(meshData.triangles.length);
      meshData.triangles.forEach(function (triangle, i) {
        this._indices[i] = triangle;
      }, this);
    }

    /**
     * An array of normal vectors for each vertex defined in <code>Mesh._positions</code>.
     * @type {Array.<Number>}
     * @private
     */
    this._normals = [];
    if (meshData.normals && meshData.normals.length) {
      this._normals = new Float64Array(meshData.normals.length);
      meshData.normals.forEach(function (normal, i) {
        this._normals[i] = normal;
      }, this);
    }

    /**
     * The location of the mesh object, specified by latitude, longitude, and elevation.
     * @see {@link atlas/model/Mesh#_geoLocation}
     * @type {atlas/model/Vertex}
     * @private
     */
    this._geoLocation = {};
    if (meshData.geoLocation) {
      this._geoLocation = new Vertex(meshData.geoLocation);
    }

    /**
     * The scale of the Mesh object.
     * @see {@link atlas/model/Mesh#_scale}
     * @type {atlas/model/Vertex}
     * @private
     */
    this._scale = {};
    if (meshData.scale && meshData.scale.length) {
      this._scale = new Vertex(meshData.scale);
    }

    /**
     * The Cesium Primitive object.
     * @type {cesium/Core/Primitive}
     * @private
     */
    this._primitive = {};
  };
  extend(MeshCore, Mesh);


  /**
   * Shows the Mesh. The rendering data is recreated if it has been invalidated.
   */
  Mesh.prototype.show = function () {
    if (this.isVisible()) { return; }

    if (!this.isRenderable()) {
      this._createPrimitive();
    }
    console.debug('Showing entity', this._id);
    this._renderable = this._primitive.show = true;
  };

  /**
   * Hides the Mesh.
   */
  Mesh.prototype.hide = function () {
    (this.isVisible()) && this._primitive && (this._primitive.show = false);
  };

  /**
   * @returns {Boolean} Whether the Mesh is visible.
   */
  Mesh.prototype.isVisible = function () {
    return this._primitive && this._primitive.show;
  };

  /**
   * Creates the Cesium primitive object required to render the Mesh.
   * The Primitive object contains data to transform the Mesh from model space to
   * world space, as well as controlling the appearance of the Mesh.
   * @private
   */
  Mesh.prototype._createPrimitive = function () {
    if (!this._geometry) { this._createGeometry(); }
    var ellipsoid = this._renderManager._widget.centralBody.getEllipsoid();

    this._modelMatrix = Matrix4.multiplyByUniformScale(
      Matrix4.multiplyByTranslation(
        Transforms.eastNorthUpToFixedFrame(ellipsoid.cartographicToCartesian(
          Cartographic.fromDegrees(this._geoLocation.y, this._geoLocation.x))),
        new Cartesian3(0.0, 0.0, 35)),
      0.1);

    var instance = new GeometryInstance({
      geometry : this._geometry,
      modelMatrix : this._modelMatrix,
      attributes : {
        color : ColorGeometryInstanceAttribute.fromColor(Color.GREEN)
      }
    });

    this._primitive = new Primitive({
      id: this._id,
      geometryInstances : instance,
      appearance : new PerInstanceColorAppearance({
        flat : false,
        translucent : false
      }),
      debugShowBoundingVolume: false
    });
    this._renderManager._widget.scene.getPrimitives().add(this._primitive);
    this._primitive.show = false;
    this.setRenderable(true);
  };

  /**
   * Creates Cesium Geometry object required to render the Mesh.
   * The Geometry represents the Mesh in 'model space'.
   * @returns {cesium|Core|Geometry}
   * @private
   */
  Mesh.prototype._createGeometry = function () {
    this._geometry = {};
    var attributes = new GeometryAttributes({
      position : new GeometryAttribute({
        componentDatatype : ComponentDatatype.DOUBLE,
        componentsPerAttribute : 3,
        values : this._positions
      })
    });

    var geometry = GeometryPipeline.computeNormal(new Geometry({
      attributes: attributes,
      indices: this._indices,
      primitiveType: PrimitiveType.TRIANGLES,
      boundingSphere: BoundingSphere.fromVertices(this._positions)
    }));

    this._geometry.attributes = geometry.attributes;
    this._geometry.indices = geometry.indices;
    this._geometry.primitiveType = geometry.primitiveType;
    this._geometry.boundingSphere = geometry.boundingSphere;

    return this._geometry;
  };

  return Mesh;
});

