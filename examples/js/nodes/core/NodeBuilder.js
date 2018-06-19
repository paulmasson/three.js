/**
 * @author sunag / http://www.sunag.com.br/
 */

THREE.NodeBuilder = function ( material, renderer ) {

	this.material = material;
	this.renderer = renderer;

	this.caches = [];
	this.slots = [];

	this.keywords = {};

	this.parsing = false;
	this.optimize = true;

	this.update();

};

THREE.NodeBuilder.type = {
	float: 'fv1',
	vec2: 'v2',
	vec3: 'v3',
	vec4: 'v4',
	mat4: 'v4',
	int: 'iv1'
};

THREE.NodeBuilder.constructors = [
	'float',
	'vec2',
	'vec3',
	'vec4'
];

THREE.NodeBuilder.elements = [
	'x',
	'y',
	'z',
	'w'
];

THREE.NodeBuilder.prototype = {

	constructor: THREE.NodeBuilder,

	addCache: function ( name, requires ) {

		this.caches.push( {
			name: name || '',
			requires: requires || {}
		} );

		return this.update();

	},

	removeCache: function () {

		this.caches.pop();

		return this.update();

	},

	addSlot: function ( name ) {

		this.slots.push( {
			name: name || ''
		} );

		return this.update();

	},

	removeSlot: function () {

		this.slots.pop();

		return this.update();

	},

	isCache: function ( name ) {

		var i = this.caches.length;

		while ( i -- ) {

			if ( this.caches[ i ].name == name ) return true;

		}

		return false;

	},

	isSlot: function ( name ) {

		var i = this.slots.length;

		while ( i -- ) {

			if ( this.slots[ i ].name == name ) return true;

		}

		return false;

	},

	update: function () {

		var cache = this.caches[ this.caches.length - 1 ];
		var slot = this.slots[ this.slots.length - 1 ];

		this.slot = slot ? slot.name : '';
		this.cache = cache ? cache.name : '';
		this.requires = cache ? cache.requires : {};

		return this;

	},

	require: function ( name, node ) {

		this.requires[ name ] = node;

		return this;

	},

	include: function ( node, parent, source ) {

		this.material.include( this, node, parent, source );

		return this;

	},

	colorToVector: function ( color ) {

		return color.replace( 'r', 'x' ).replace( 'g', 'y' ).replace( 'b', 'z' ).replace( 'a', 'w' );

	},

	getConstructorFromLength: function ( len ) {

		return THREE.NodeBuilder.constructors[ len - 1 ];

	},

	getFormatName: function ( format ) {

		return format.replace( /c/g, 'v3' ).replace( /fv1/g, 'v1' ).replace( /iv1/g, 'i' );

	},

	isFormatMatrix: function ( format ) {

		return /^m/.test( format );

	},

	getFormatLength: function ( format ) {

		return parseInt( this.getFormatName( format ).substr( 1 ) );

	},

	getFormatFromLength: function ( len ) {

		if ( len == 1 ) return 'fv1';

		return 'v' + len;

	},
	
	resolve: function() {
		
		for(var i = 0; i < arguments.length; i++) {
			
			var nodeCandidate = arguments[i];
			
			if (nodeCandidate !== undefined) {
				
				if (nodeCandidate.isNode) {
				
					return nodeCandidate;
					
				} else if (nodeCandidate.isTexture) {
					
					switch( nodeCandidate.mapping ) {
					
						case THREE.CubeReflectionMapping:
						case THREE.CubeRefractionMapping:

							return new THREE.CubeTextureNode( nodeCandidate );

							break;
						
						case THREE.CubeUVReflectionMapping:
						case THREE.CubeUVRefractionMapping:

							return new THREE.TextureCubeNode( new THREE.TextureNode( nodeCandidate ) );

							break;
							
						default:
						
							return new THREE.TextureNode( nodeCandidate );
						
					}
					
				} else if (nodeCandidate.isVector2) {
					
					return new THREE.Vector2Node( nodeCandidate );
					
				} else if (nodeCandidate.isVector3) {
					
					return new THREE.Vector3Node( nodeCandidate );
					
				} else if (nodeCandidate.isVector4) {
					
					return new THREE.Vector4Node( nodeCandidate );
					
				}
				
			}
			
		}
		
	},

	format: function ( code, from, to ) {

		var format = this.getFormatName( to + ' = ' + from );

		switch ( format ) {

			case 'v1 = v2': return code + '.x';
			case 'v1 = v3': return code + '.x';
			case 'v1 = v4': return code + '.x';
			case 'v1 = i': return 'float( ' + code + ' )';

			case 'v2 = v1': return 'vec2( ' + code + ' )';
			case 'v2 = v3': return code + '.xy';
			case 'v2 = v4': return code + '.xy';
			case 'v2 = i': return 'vec2( float( ' + code + ' ) )';

			case 'v3 = v1': return 'vec3( ' + code + ' )';
			case 'v3 = v2': return 'vec3( ' + code + ', 0.0 )';
			case 'v3 = v4': return code + '.xyz';
			case 'v3 = i': return 'vec2( float( ' + code + ' ) )';

			case 'v4 = v1': return 'vec4( ' + code + ' )';
			case 'v4 = v2': return 'vec4( ' + code + ', 0.0, 1.0 )';
			case 'v4 = v3': return 'vec4( ' + code + ', 1.0 )';
			case 'v4 = i': return 'vec4( float( ' + code + ' ) )';

			case 'i = v1': return 'int( ' + code + ' )';
			case 'i = v2': return 'int( ' + code + '.x )';
			case 'i = v3': return 'int( ' + code + '.x )';
			case 'i = v4': return 'int( ' + code + '.x )';

		}

		return code;

	},

	getTypeByFormat: function ( format ) {

		return THREE.NodeBuilder.type[ format ] || format;

	},

	getUuid: function ( uuid, useCache ) {

		useCache = useCache !== undefined ? useCache : true;

		if ( useCache && this.cache ) uuid = this.cache + '-' + uuid;

		return uuid;

	},

	getElementByIndex: function ( index ) {

		return THREE.NodeBuilder.elements[ index ];

	},

	getIndexByElement: function ( elm ) {

		return THREE.NodeBuilder.elements.indexOf( elm );

	},

	isShader: function ( shader ) {

		return this.shader === shader;

	},

	setShader: function ( shader ) {

		this.shader = shader;

		return this;

	},

	getTexelDecodingFunctionFromTexture: function( code, texture ) {

		var gammaOverrideLinear = this.getTextureEncodingFromMap( texture, this.requires.gamma && ( this.renderer ? this.renderer.gammaInput : false ) )

		return this.getTexelDecodingFunction( code, gammaOverrideLinear );

	},

	getTexelDecodingFunction: function( value, encoding ) {

		var components = this.getEncodingComponents( encoding );

		return components[ 0 ] + 'ToLinear' + components[ 1 ].replace( 'value', value );

	},

	getTexelEncodingFunction: function( value, encoding ) {

		var components = this.getEncodingComponents( encoding );

		return 'LinearTo' + components[ 0 ] + components[ 1 ].replace( 'value', value );

	},

	getEncodingComponents: function( encoding ) {

		switch ( encoding ) {

			case THREE.LinearEncoding:
				return [ 'Linear', '( value )' ];
			case THREE.sRGBEncoding:
				return [ 'sRGB', '( value )' ];
			case THREE.RGBEEncoding:
				return [ 'RGBE', '( value )' ];
			case THREE.RGBM7Encoding:
				return [ 'RGBM', '( value, 7.0 )' ];
			case THREE.RGBM16Encoding:
				return [ 'RGBM', '( value, 16.0 )' ];
			case THREE.RGBDEncoding:
				return [ 'RGBD', '( value, 256.0 )' ];
			case THREE.GammaEncoding:
				return [ 'Gamma', '( value, float( GAMMA_FACTOR ) )' ];
			default:
				throw new Error( 'unsupported encoding: ' + encoding );

		}

	},

	getEncodingComponents: function( encoding ) {

		switch ( encoding ) {

			case THREE.LinearEncoding:
				return [ 'Linear', '( value )' ];
			case THREE.sRGBEncoding:
				return [ 'sRGB', '( value )' ];
			case THREE.RGBEEncoding:
				return [ 'RGBE', '( value )' ];
			case THREE.RGBM7Encoding:
				return [ 'RGBM', '( value, 7.0 )' ];
			case THREE.RGBM16Encoding:
				return [ 'RGBM', '( value, 16.0 )' ];
			case THREE.RGBDEncoding:
				return [ 'RGBD', '( value, 256.0 )' ];
			case THREE.GammaEncoding:
				return [ 'Gamma', '( value, float( GAMMA_FACTOR ) )' ];
			default:
				throw new Error( 'unsupported encoding: ' + encoding );

		}

	},
	
	getTextureEncodingFromMap: function ( map, gammaOverrideLinear ) {

		var encoding;

		if ( ! map ) {

			encoding = THREE.LinearEncoding;

		} else if ( map.isTexture ) {

			encoding = map.encoding;

		} else if ( map.isWebGLRenderTarget ) {

			console.warn( "THREE.WebGLPrograms.getTextureEncodingFromMap: don't use render targets as textures. Use their .texture property instead." );
			encoding = map.texture.encoding;

		}

		// add backwards compatibility for WebGLRenderer.gammaInput/gammaOutput parameter, should probably be removed at some point.
		if ( encoding === THREE.LinearEncoding && gammaOverrideLinear ) {

			encoding = THREE.GammaEncoding;

		}

		return encoding;

	}

};
