define([
  'atlas/lib/Q',
  'atlas/lib/utility/Setter',
  'atlas/model/GeoPoint',
  'atlas-cesium/cesium/Source/Scene/Model',
  'atlas-cesium/model/Mesh'
], function(Q, Setter, GeoPoint, CesiumModel, Mesh) {

  /**
   * @typedef {atlas-cesium.model.GltfMesh}
   * @ignore
   */
  var GltfMesh;

  /**
   * GltfMesh represents a Model defined by Khronos Group GLTF runtime assest format. @see
   *     {@link https://github.com/KhronosGroup/glTF} for the specification. A Collada to GLTF
   *     converter is available.
   *
   * @see {@link atlas.model.Mesh}
   * @see {@link atlas.model.GeoEntity}
   *
   * @class atlas-cesium.model.GltfMesh
   * @extends atlas-cesium.model.Mesh
   */
  GltfMesh = Mesh.extend( /** @lends atlas-cesium.model.GltfMesh# */ {

    /**
     * The base URL that URLs with the GLTF data are relative to.
     * @type {String}
     */
    _baseUrl: null,

    _init: function(id, meshData, args) {
      this._super(id, meshData, args);

      this._baseUrl = Setter.def(meshData.baseUrl, '');
      this._centroid = new GeoPoint(this._geoLocation);
    },

    _createPrimitive: function() {
      var args = {
        id: this.getId(),
        baseUrl: this._baseUrl,
        modelMatrix: this._getModelMatrix(),
        scale: this._uniformScale
      };

      if (this._gltf) {
        args.gltf = this._gltf;
        return new CesiumModel(args);
      } else if (this._gltfUrl) {
        args.url = this._gltfUrl;
        return CesiumModel.fromGltf(args);
      } else {
        throw new Error('Tried to create GLTF Mesh without specifying GLTF JSON or URL.');
      }
    },

    _updateAppearance: function() {
      // Overridden to be no-op as it is called automatically by Mesh._build. Apart from the call
      // to this function, the logic in Mesh._build is needed here and should not be replicated. DRY
    },

    _calculateVertices: function() {
      throw new Error('Function _calculateVertices not supported by GltfMesh');
    },

    _getFootprintVertices: function() {
      throw new Error('Function _getFootprintVertices not supported by GltfMesh');
    },

    getOpenLayersGeometry: function() {
      throw new Error('Function _getOpenLayersGeometry not supported by GltfMesh');
    },

    getCentroid: function() {
      return this._geoLocation;
    }

  });

  return GltfMesh;

});
