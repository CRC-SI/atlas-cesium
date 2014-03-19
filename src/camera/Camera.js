define([
  'atlas/util/AtlasMath',
  'atlas/util/DeveloperError',
  'atlas/model/Vertex',
  // Cesium imports
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Scene/CameraFlightPath',
  // Base class.
  'atlas/camera/Camera',
  'atlas/lib/utility/Log'
], function (AtlasMath, DeveloperError, Vertex, Cartographic, CameraFlightPath,
             CameraCore, Log) {
  /**
   * @classdesc The Camera object controls the position and orientation of the camera.
   * It exposes an API to set position and orientation, zoom to a given GeoEntity
   * or a bookmarked location, and to manual move the Camera.
   * @author Brendan Studds
   *
   * @param {atlas.render.RenderManager} renderManager - The current Atlas RenderManager instance.
   * @param {Object} args - The arguments for the constructor.
   * @param {Object} [args.position] - The initial position of the Camera.
   * @property {Number} [args.position.lat=-37] - The initial latitude in decimal degrees in the range [-90, 90].
   * @property {Number} [args.position.lng=144] - The initial longitude in decimal degrees in the range [-180, 180].
   * @property {Number} [args.position.elevation=20000] - The initial elevation above the Earth's surface metres.
   * @param {Object} [args.orientation] - The initial orientation of the Camera.
   * @property {Number} [args.orientation.tilt=0] - The tilt (or pitch) about the Camera's transverse axis in decimal degrees in the range [0, 180]. At 0 degrees the Camera is pointing at the point directly below it, at 180 degrees it is looking the opposite direction.
   * @property {Number} [args.orientation.bearing=0] - The bearing (or yaw) about the normal axis from the surface to the camera in decimal degrees in the range [0, 360]. At 0 (and 360) degrees the Camera is facing North, 90 degrees it is facing East, etc.
   * @property {Number} [args.orientation.rotation=0] - The rotation (or roll) about the orientation vector of the Camera in decimal degrees in the range [-180, 180].
   * @param {atlas.render.RenderManager} [args.renderManager] - The Atlas render manager instance.
   *
   * @class atlas-cesium.camera.Camera
   * @extends atlas.camera.Camera
   */
  return CameraCore.extend( /** @lends atlas-cesium.camera.Camera# */ {

    _init: function (args) {
      if (!args.renderManager) {
        throw new DeveloperError('Can not create Atlas-cesium Camera without render manager.');
      }
      this._super(args);
      this._renderManager = args.renderManager;
    },

    _animateCamera: function (newCamera) {
      // TODO(bpstudds): Allow for a non-default orientation.
      var latitude = AtlasMath.toRadians(newCamera.position.lat),
          longitude = AtlasMath.toRadians(newCamera.position.lng),
          altitude = newCamera.position.elevation,
          position = new Cartographic(longitude, latitude, altitude);
      if (newCamera.duration > 0) {
        // Use a flight for non-zero zoom duration...
        var flight = CameraFlightPath.createAnimationCartographic(
          this._renderManager._widget.scene, {
            destination: position,
            duration: newCamera.duration
          }
        );
        this._renderManager.getAnimations().add(flight);
      } else {
        // ... otherwise just move camera directly to target position.
        var cesiumCamera = this._renderManager.getCesiumCamera(),
            controller = cesiumCamera.controller;
        controller.setPositionCartographic(position);
        controller.tilt = AtlasMath.toRadians(90 - newCamera.orientation.tilt);
        controller.heading = AtlasMath.toRadians(360 - newCamera.orientation.bearing);
      }
      Log.debug('animating camera change', newCamera);
      this._position = newCamera.position;
      this._orientation = newCamera.orientation;
    }
  });
});
