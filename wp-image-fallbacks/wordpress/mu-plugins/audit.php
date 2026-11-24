<?php
// Lets Jetpack output its Open Graph tags without a WordPress.com connection.
if ( ! defined( 'JETPACK_DEV_DEBUG' ) ) {
	define( 'JETPACK_DEV_DEBUG', true );
}
add_filter( 'jetpack_enable_open_graph', '__return_true' );
