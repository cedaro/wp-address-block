(function( blocks, components, element, i18n, _ ) {
	var __ = i18n.__;
	var el = element.createElement;
	var Editable = blocks.Editable;
	var InspectorControls = blocks.InspectorControls;
	var SelectControl = components.SelectControl;
	var TextareaControl = components.TextareaControl;
	var ToggleControl = components.ToggleControl;

	var ADDRESS_TEMPLATE_STANDARD = '{name}\n{street}\n{city}, {state} {postal_code}\n{country}';
	var ADDRESS_TEMPLATE_INTERNATONAL = '{name}\n{street}\n{postal_code} {city}\n{state}\n{country}';

	var ADDRESS_TEMPLATES = {
		AU: '{name}\n{street}\n{city} {state} {postal_code}\n{country}',
		CA: ADDRESS_TEMPLATE_STANDARD,
		GB: '{name}\n{street}\n{city}\n{postal_code}\n{country}',
		US: ADDRESS_TEMPLATE_STANDARD
	};

	function tokenize( text ) {
		var cursor = 0;
		var match;
		var pattern = /{([^}]+)?}/g;
		var tokens = [];

		while ( match = pattern.exec( text ) ) {
			tokens.push( text.slice( cursor, match.index ) )
			tokens.push( match[0] );
			cursor = match.index + match[0].length;
		}

		tokens.push( text.substr( cursor, text.length - cursor ) );

		return _.without( tokens, '' );
	}

	blocks.registerBlockType( 'cedaro/address', {
		title: __( 'Address' ),

		description: __( 'Display an address with Schema.org markup.' ),

		icon: 'id',

		category: 'formatting',

		keywords: [ __( 'address' ), __( 'vcard' ) ],

		attributes: {
			name: {
				type: 'array',
				source: 'children',
				selector: '.vcard__name'
			},
			street: {
				type: 'array',
				source: 'children',
				selector: '.vcard__street'
			},
			city: {
				type: 'array',
				source: 'children',
				selector: '.vcard__city'
			},
			state: {
				type: 'array',
				source: 'children',
				selector: '.vcard__state'
			},
			postal_code: {
				type: 'array',
				source: 'children',
				selector: '.vcard__postal-code'
			},
			country: {
				type: 'array',
				source: 'children',
				selector: '.vcard__country'
			},
			format: {
				type: 'string',
				default: 'US'
			},
			template: {
				type: 'string',
				default: ADDRESS_TEMPLATES.US
			},
			is_country_hidden: {
				type: 'boolean',
				default: false
			}
		},

		edit: function( props ) {
			var attributes = props.attributes;
			var focusedEditable = props.focus ? props.focus.editable || 'name' : null;

			var attributeMap = {
				name: {
					placeholder: __( 'Name' )
				},
				street: {
					placeholder: __( 'Street' )
				},
				city: {
					placeholder: __( 'City' )
				},
				state: {
					placeholder: __( 'State' )
				},
				postal_code: {
					placeholder: __( 'Postal Code' )
				},
				country: {
					placeholder: __( 'Country' )
				}
			};

			if ( 'CA' === attributes.format ) {
				attributeMap.state.placeholder = __( 'Province' );
			} else if ( 'GB' === attributes.format ) {
				attributeMap.postal_code.placeholder = __( 'Postcode' );
			} else if ( 'US' === attributes.format ) {
				attributeMap.postal_code.placeholder = __( 'Zip Code' );
			}

			var controls = el( InspectorControls, { key: 'inspector' },
				el( ToggleControl, {
					label: __( 'Hide the country?' ),
					checked: attributes.is_country_hidden,
					onChange: function() {
						props.setAttributes({ is_country_hidden: ! attributes.is_country_hidden });
					}
				}),
				el( SelectControl, {
					label: __( 'Format' ),
					value: attributes.format,
					options: [
						{ label: __( 'Australia' ), value: 'AU' },
						{ label: __( 'Canada' ), value: 'CA' },
						{ label: __( 'United Kingdom' ), value: 'GB' },
						{ label: __( 'United States' ), value: 'US' },
						{ label: __( 'International' ), value: 'international' },
						{ label: __( 'Custom' ), value: 'custom' },
					],
					onChange: function( value ) {
						props.setAttributes({ format: value });

						switch ( value ) {
							case 'custom' :
								break;
							case 'international' :
								props.setAttributes({ template: ADDRESS_TEMPLATE_INTERNATONAL });
								break;
							default :
								props.setAttributes({ template: ADDRESS_TEMPLATES[ value ] });
								break;
						}
					}
				}),
				'custom' === attributes.format && el( TextareaControl, {
					label: __( 'Template' ),
					value: attributes.template,
					onChange: function( value ) {
						props.setAttributes({ template: value });
					}
				})
			);

			function parse( token ) {
				var pattern = new RegExp( '^{(' + _.keys( attributeMap ).join( '|' ) + ')}$' );

				if ( pattern.test( token ) ) {
					var attributeName = token.replace( /{|}/g, '' );
					var attributeProps = attributeMap[ attributeName ];

					return el( Editable, {
						key: attributeName,
						wrapperClassName: 'vcard__' + attributeName.replace( '_', '-' ) + '-wrapper',
						tagName: 'span',
						className: 'vcard__' + attributeName.replace( '_', '-' ),
						placeholder: attributeProps.placeholder,
						keepPlaceholderOnFocus: true,
						value: attributes[ attributeName ],
						formattingControls: [ 'bold', 'italic', 'link' ],
						onChange: function( value ) {
							var attributes = {};
							attributes[ attributeName ] = value;
							props.setAttributes( attributes );
						},
						focus: focusedEditable === attributeName ? props.focus : null,
						onFocus: function( focus ) {
							props.setFocus( _.extend( {}, focus, { editable: attributeName } ) );
						}
					});
				}

				return el( 'span', {}, token );
			}

			var elements = _.chain( attributes.template.split( '\n' ) )
				.map( tokenize )
				.map(function( tokens ) {
					return tokens.map( parse ).concat([ el( 'br' ) ]);
				})
				.flatten()
				.initial() // Removes the trailing line break element.
				.value();

			var className = props.className;
			className += ' is-' + attributes.format;
			className += attributes.is_country_hidden ? ' is-country-hidden' : '';

			return [
				props.focus && controls,
				el.apply( null, [ 'div', { className: className, key: 'ui' } ].concat( elements ) )
			];
		},

		save: function( props ) {
			var attributes = props.attributes;
			var template = attributes.template;

			var attributeMap = {
				name: {
					className: 'vcard__name',
					itemProp: 'name'
				},
				street: {
					className: 'vcard__street',
					itemProp: 'streetAddress'
				},
				city: {
					className: 'vcard__city',
					itemProp: 'addressLocality'
				},
				state: {
					className: 'vcard__state',
					itemProp: 'addressRegion'
				},
				postal_code: {
					className: 'vcard__postal-code',
					itemProp: 'postalCode'
				},
				country: {
					className: 'vcard__country' + ( attributes.is_country_hidden ? ' screen-reader-text' : '' ),
					itemProp: 'addressCountry'
				}
			};

			function parse( token ) {
				var pattern = new RegExp( '^{(' + _.keys( attributeMap ).join( '|' ) + ')}$' );

				if ( pattern.test( token ) ) {
					var attributeName = token.replace( /{|}/g, '' );
					var attributeValue = attributes[ attributeName ];
					var attributeProps = attributeMap[ attributeName ];

					if ( _.isEmpty( attributeValue ) ) {
						return '';
					}

					return el(
						'span',
						{
							className: attributeProps.className,
							itemProp: attributeProps.itemProp
						},
						attributeValue
					);
				}

				return token;
			}

			// Remove variables from the template for empty attributes.
			_.each( _.keys( attributeMap ), function( attributeName ) {
				if ( _.isEmpty( attributes[ attributeName ] ) ) {
					template = template.replace( '{' + attributeName + '}', '' );
				}
			});

			var elements = _.chain( template.split( '\n' ) )
				.map(function( line ) {
					return line.replace( /^[, ]+|[, ]+$/g, '' );
				})
				.without( '' )
				.map( tokenize )
				.map(function( tokens ) {
					return tokens.map( parse ).concat([ el( 'br' ) ]);
				})
				.flatten()
				.initial()
				.value();

			return el.apply( null, [ 'div', { itemScope: true, itemType: 'http://schema.org/PostalAddress' } ].concat( elements ) );
		}
	});
})(
	window.wp.blocks,
	window.wp.components,
	window.wp.element,
	window.wp.i18n,
	window._
);
