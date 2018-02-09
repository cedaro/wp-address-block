<?php
/**
 * WP Address Block
 *
 * @package   AddressBlock
 * @copyright Copyright (c) 2017, Cedaro, LLC
 * @license   GPL-2.0+
 *
 * @wordpress-plugin
 * Plugin Name: Address Block
 * Plugin URI:  https://github.com/cedaro/wp-address-block
 * Description: A Gutenberg block for displaying an address with Schema.org markup.
 * Version:     0.1.0
 * Author:      Cedaro
 * Author URI:  https://www.cedaro.com/
 * License:     GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wp-address-block
 * Domain Path: /languages
 */

add_action( 'enqueue_block_editor_assets', function() {
	wp_enqueue_script(
		'cedaro-address-block-editor',
		plugins_url( 'block.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element' )
	);

	wp_enqueue_style(
		'cedaro-address-block-editor',
		plugins_url( 'editor.css', __FILE__ ),
		array( 'wp-blocks' )
	);
} );
